String.prototype.startsWith = function(str)
{
	return this.substr(0, str.length) === str;
};

String.prototype.endsWith = function(str)
{
	return this.substr(this.length - str.length) === str;
};

String.prototype.deHtml = function()
{
	return this.replace(/<(?:.|\n)*?>/gm, '');
};

function randomInt(arg1, arg2)
{
	if (arg2 !== undefined) // randomInt(min, max)
	{
		return Math.floor(Math.random() * (arg2 - arg1)) + arg1;
	}
	else // randomInt(max)
	{
		return Math.floor(Math.random() * arg1);
	}
}

var animations =
{
	frontAttack:
	{
		type: "points",
		points: [ [ 0, 0 ], [ 128, -48 ], [ 0, 0 ] ],
		durations: [ 0.25, 0.25 ],
		reset: true
	},
	backAttack:
	{
		type: "points",
		points: [ [ 0, 0 ], [ -128, 48 ], [ 0, 0 ] ],
		durations: [ 0.25, 0.25 ],
		reset: true
	}
};

var _log = [];
var log = [];
var pause = false;
var frontPlayer, backPlayer;
var crossRefs = [];
var timer;
var nextFn, nextTime;
var fps = 60;
var nicknames = [ {}, {} ];
var teams = [ [], [] ];
var currents = [ "", "" ];

function init()
{
	$("#doReplay").unbind("click").click(function()
	{
		$("#inputContainer").hide();
		$("#replayContainer").show();
		
		log = $("#input").val().replace(/\r/g, "").split("\n").map(function(item)
		{
			item = $.trim(item);
			
			if (item.endsWith("<br />"))
			{
				item = item.substr(0, item.length - 6);
			}
			
			return item;
		});
	
		_log = log.slice(0);
		setupViewer();
	});
	
	$("#file").change(function()
	{
		var file = $("#file").get(0).files[0];
		var reader = new FileReader();
		
		//console.log(file);
		
		reader.onload = function(e)
		{
			var text = e.target.result;
			$("#input").val(text);
		};
		
		reader.readAsText(file);
	})
}

function escapeHtml(x)
{
	var map =
	{
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;",
		"'": "&#39;",
		"/": "&#x2F;"
	};
	
	for (var thing in map)
	{
		x = x.replace(new RegExp(thing, "g"), map[thing]);
	}
	
	return x;
}

function setupViewer()
{
	$("#start").unbind("click").click(startViewer);
	$("#start").text("Start");
	$("#viewer").css({ "background-image": "url('./backgrounds/" + randomInt(0, 3) + ".png')" })
	
	log = _log.slice(0);
	pause = false;
	clearTimeout(timer);
}

function startViewer()
{
	$("#log").empty();
	$("#start").unbind("click").click(pauseViewer);
	$("#start").text("Pause");
	pause = false;
	crossRefs = [ [], [] ];
	
	stepViewer();
}

function stepViewer()
{
	clearTimeout(timer);
	
	if (pause)
	{
		return;
	}
	
	if (log.length === 0)
	{
		log = _log.slice(0);
		pause = true;
		
		$("#start").unbind("click").click(setupViewer);
		$("#start").text("Reset");
		
		return;
	}
	
	// we read it line by line and determine the next line reading etc through timers and what's going on //
	
	var line = log[0];
	log.splice(0, 1);
	var nextLine = log[0];
	
	nextTime = 50;
	nextFn = stepViewer;
	
	if (line.startsWith("<span class=\""))
	{
		appendLog(line);
		
		if (line.startsWith("<span class=\"Space\">"))
		{
			clearVLog();
		}
	}
		
	if (nextLine.startsWith("<span class=\"Space\">"))
	{
		nextTime = 500;
	}
	
	if (line.startsWith("<title>"))
	{
		var l = line.substr(7);
		l = l.substr(0, l.length - 8);
		document.title = l;
		
		while (l.indexOf(" vs ") !== -1)
		{
			crossRefs[0].push([ l.substr(0, l.indexOf(" vs ")), l.substr(l.indexOf(" vs ") + 4) ]);
			l = l.substr(l.indexOf(" vs ") + 4);
		}
	}
	else if (line.startsWith("</head><body>"))
	{
		appendLog(line.substr(13));
		
		var l = line.substr(line.indexOf("Battle between ") + 15);
		l = l.substr(0, l.length - 27);
		
		while (l.indexOf(" and ") !== -1)
		{
			crossRefs[1].push([ l.substr(0, l.indexOf(" and ")), l.substr(l.indexOf(" and ") + 5) ]);
			l = l.substr(l.indexOf(" and ") + 5);
		}
		
		var c = undefined;
		
		for (var i = 0; i < crossRefs[0].length; i++)
		{
			for (var j = 0; j < crossRefs[1].length; j++)
			{
				if (JSON.stringify(crossRefs[0][i]) === JSON.stringify(crossRefs[1][j]))
				{
					c = crossRefs[0][i];
					break;
				}
			}
			
			if (c !== undefined)
			{
				break;
			}
		}
		
		frontPlayer = c[0];
		backPlayer = c[1];
		
		// check to see if we have to fuckin switch god damn whoever made this //
		var bad = _log[20].startsWith("<!--the foe's ");
		console.log(_log[20]);
		console.log(bad);
		
		if (bad)
		{
			var temp = frontPlayer;
			frontPlayer = backPlayer;
			backPlayer = temp;
		}
	}
	else if (line.startsWith("<span class=\"Teams\">"))
	{
		var l = line.substr(51);
		var f = l.substr(0, 4) === "Your";
		var pre = (f ? "front" : "back");
		
		var team = l.substr(l.indexOf("</b>") + 4);
		team = team.substr(0, team.indexOf("<")).toLowerCase();
		team = team.split(" / ");
		
		for (var i = 0; i < 6; i++)
		{
			var name = (i < team.length ? team[i].toLowerCase() : "missingno");
			$("#" + pre + "Icon" + i).get(0).src = "icons/" + name + ".png";
		}
		
		teams[+(!f)] = team;
	}
	else if (line.startsWith("<span class=\"SendOut\">"))
	{
		var l = line.substr(22);
		var player = l.substr(0, l.indexOf(" sent out "));
		var pre = (player === frontPlayer ? "front" : "back");
		var poke = l.substr(player.length + 10);
		poke = poke.substr(0, poke.length - 7);
		var isNick = false;
		var _poke;
		var ind = +(player === backPlayer);
		
		if (poke.endsWith(")"))
		{
			isNick = true;
			_poke = poke.substr(0, poke.lastIndexOf("("));
			poke = poke.substr(poke.indexOf("(") + 1);
				
			nicknames[ind][_poke] = poke.substr(0, poke.length - 1);
		}
		
		poke = poke.substr(0, poke.length - 1);
		
		if (!isNick)
		{
			nicknames[ind][poke] = poke;
			_poke = poke;
		}
		
		poke = poke.toLowerCase();
		
		$("#" + pre + "Poke").get(0).src = "sprites/" + (player === frontPlayer ? "back/" : "") + poke + ".png";
		
		currents[ind] = nicknames[_poke];
		
		var oldPos = log[0].substr(log[0].lastIndexOf(" "));
		oldPos = parseInt(oldPos.substr(0, oldPos.length - 4));
		
		var newPos = log[1].substr(log[1].lastIndexOf(" "));
		newPos = parseInt(newPos.substr(0, newPos.length - 4));
		
		if (newPos === 0 && oldPos === 0)
		{
			// first sendout, fuck whoever made these log files //
			
			oldPos = teams[ind].indexOf(poke);
		}
		
		var p1 = $("#" + pre + "Icon" + oldPos).get(0);
		var p2 = $("#" + pre + "Icon" + newPos).get(0);
		
		var s1 = p1.src;
		var s2 = p2.src;
		
		p1.src = s2;
		p2.src = s1;
	}
	else if (line.startsWith("<span class=\"UseAttack\">"))
	{
		var name = line.substr(24);
		name = name.substr(0, name.indexOf(" used <b><span style='color:"));
		
		var front = !name.startsWith("The foe&apos;s ");
		var pre = (front ? "front" : "back");
		
		if (!front)
		{
			name = name.substr(15);
		}
		
		var poke = nicknames[!front];
		
		var a = new Animation(animations[pre + "Attack"], $("#" + pre + "Poke"), stepViewer);
		nextFn = a.step;
		nextTime = 100;
	}
	
	timer = setTimeout(nextFn, nextTime);
}

function pauseViewer()
{
	pause = true;
	
	$("#start").unbind("click").click(function()
	{
		$("#start").unbind("click").click(pauseViewer);
		$("#start").text("Pause");
		pause = false;
		
		stepViewer();
	});
	
	$("#start").text("Resume");
}

function appendLog(html)
{
	var d = document.createElement("div");
	d.className = "logItem";
	$(d).html(html);
	$("#log").append(d);
	$("#log").get(0).scrollTop = $("#log").get(0).scrollHeight;
	
	$("#vlog").append($(d).clone());
}

function clearVLog()
{
	$("#vlog").empty();
}