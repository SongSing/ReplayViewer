function Animation(a, e, callback)
{
	this.animation = a;
	this.element = $(e);
	this.callback = callback;
	this.frames = 0;
	this.frameCounter = 0;
	this.steps = [];
	this.origin = { left: this.element.get(0).offsetLeft, top: this.element.get(0).offsetTop };
	this.timer = undefined;
	
	if (a.type === "linear")
	{
		this.frames = fps * a.duration;
		var x = [];
		var y = [];
		
		var xd = a.end[0] - a.start[0];
		var yd = a.end[1] - a.start[1];
		
		var xp = xd / this.frames;
		var yp = yd / this.frames;
		
		for (var i = 0; i < this.frames; i++)
		{
			x.push(xp * i);
			y.push(yp * i);
		}
		
		x[0] = a.start[0];
		x[x.length - 1] = a.end[0];
		
		y[0] = a.start[1];
		y[y.length - 1] = a.end[1];
		
		for (var i = 0; i < x.length; i++)
		{
			this.steps.push({ x: x[i], y: y[i], duration: a.duration / this.frames, origin: this.origin });
		}
	}
	else if (a.type === "points")
	{
		var ds = 0;
		
		for (var i = 0; i < a.durations.length; i++)
		{
			ds += a.durations[i];
		}
		
		this.frames = fps * ds;
		var o = this.origin;
		
		for (var i = 0; i < a.durations.length; i++)
		{
			var f = fps * a.durations[i];
			var x = [];
			var y = [];
			
			var start = a.points[i];
			var end = a.points[i + 1];
			
			var xd = end[0] - start[0];
			var yd = end[1] - start[1];
			
			var xp = xd / f;
			var yp = yd / f;
			
			for (var j = 0; j < f; j++)
			{
				x.push(xp * j);
				y.push(yp * j);
			}
			
			for (var j = 0; j < x.length; j++)
			{
				this.steps.push({ x: x[j], y: y[j], duration: a.durations[i] / f, origin: o });
			}
			
			o = { left: this.origin.left + end[0], top: this.origin.top + end[1] };
		}
	}
	
	var self = this;
	
	this.step = function()
	{
		clearTimeout(self.timer);
		
		var s = self.steps[self.frameCounter];
		
		self.element.css(
		{		
			"left": s.origin.left + s.x,
			"top": s.origin.top + s.y
		});
		
		self.frameCounter++;
		
		if (self.frameCounter === self.frames)
		{
			if (self.animation.reset)
			{
				self.element.css(
				{
					"left": self.origin.left,
					"top": self.origin.top
				});
			}
			
			self.callback();
			return;
		}
		
		self.timer = setTimeout(self.step, s.duration * 1000);
	};
}