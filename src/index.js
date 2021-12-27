/* Moralis init code */
const { xorWith, isUndefined } = require('lodash');
const Moralis  = require('moralis');
const serverUrl = "https://frgkvs8y2mr0.usemoralis.com:2053/server";
const appId = "JuMu1VMqwfoI3RGZ6GsiyHBN96Fgg2h7HgtvJZCz";
const contract = "0xa1B0fFF7C5C5007844a568E2bB1766479Fd72895";
Moralis.start({ serverUrl, appId });
const web3 = Moralis.enableWeb3();

var user;
var canvas = document.getElementById("board")
var cursor = document.getElementById("cursor")
var screen = document.getElementById("screen")
var scrpix = new Array(10);
var editmode = false;
var lookmode = true;
var screenmode = false;  
var pricecommand = 0;
var markedcount  = 0;
var prevurl = "===";
var piccoords = document.getElementById("board").getBoundingClientRect();
var picx = piccoords.left;
var picy = piccoords.top; 
var picw = piccoords.width;
var pich = piccoords.height; 
var savemenux = 0;
var savemenuy = 0;
var markedpos = []
var markedcol = []
// params###########################
var xs = 765;
var ys = 340;
var initprice = 100;
var masterfee = 1;
var maxpixcount = 40;
var ps = 2;
var screencolor = "red"; 
var screenwidth = 10;
var crsx = 0;
var crsy = 0;
var cursortaken = false;
var color  = new Array(xs)
var url  = new Array(xs)
var price= new Array(xs);
for(var x = 0; x < xs; x++)  {
    color[x]  = new Array(ys);
    url[x]  = new Array(ys);
    price[x]= new Array(ys);
    for (var y = 0; y < ys; y++) {
        color[x][y] = "black";
        url[x][y] = "";
        price[x][y] = initprice;
    }
}
function hide(el) {
    document.getElementById(el).style.visibility = "hidden";
};
function show(el) {
    document.getElementById(el).style.visibility = "visible";
};
function message(m) {
    document.getElementById("message").innerHTML = m;
}
function topaintmode() {
    editmode     = true; 
    lookmode     = false;
    hide("edit");
    hide("refresh");
    hide("cursor");
}
function tolookmode() {
    editmode    = false; 
    screenmode  = false;
    lookmode    = true;
    show("edit");
    show("refresh");
    hide("savemenu");
    hide("cursor");
}
function getpiccoords() {
    piccoords = document.getElementById("board").getBoundingClientRect();
    picx = piccoords.left;
    picy = piccoords.top; 
    picw = piccoords.width;
    pich = piccoords.height; 
}
async function login() {
    //const web3 = await Moralis.enableWeb3();
    user = Moralis.User.current();
    //console.log("user=" + user.get("ethAddress"));
    if (!user) {
        user = await Moralis.authenticate({ signingMessage: "Log in to theBoard" })
        .then(function (user) {
            console.log("logged in useraddress: " + user.get("ethAddress")); 
            toLoggedIn();
        })
        .catch(function (error) { console.log(error); });
    }
}
async function logOut() {
    await Moralis.User.logOut(); 
    console.log("logged out");
    toLoggedOut();
}
document.getElementById("login").onclick = login;
document.getElementById("logout").onclick = logOut;

async function getpix(pos) {
    const ABI = [
        {
            inputs: [
                {
                    internalType: "uint24",
                    name: "_pos",
                    type: "uint24"
                }
            ],
            name: "getPix",
            outputs: [
                {
                    components: [
                        {
                            "internalType": "uint256",
                            "name": "pos",
                            "type": "uint256"
                        },
                        {
                            internalType: "string",
                            name: "color",
                            type: "string"
                        },
                        {
                            internalType: "string",
                            name: "url",
                            type: "string"
                        },
                        {
                            internalType: "address",
                            name: "owner",
                            type: "address"
                        },
                        {
                            internalType: "uint256",
                            name: "price",
                            type: "uint256"
                        }
                    ],
                    internalType: "struct theboard.Pix",
                    name: "",
                    type: "tuple"
                }
            ],
            stateMutability: "view",
            type: "function"
        }
    ];
    const options = {
        contractAddress: contract,
        functionName: "getPix",
        abi: ABI,
        params: {
          _pos: pos
        },
    };
    const web3 = await Moralis.enableWeb3();
    try {
    const pixdata = await Moralis.executeFunction(options);
    //console.log(JSON.stringify(pixdata));
    //document.getElementById("result").innerHTML = pixdata;
    return pixdata;
    }
    catch (e) { 
        document.getElementById("result").innerHTML = "failed to get pixdata";
        console.log(e);
    }
}
async function updatePixels(poses) {
    let l = poses.length;
    for (var i=0; i<l; i++) { 
        let p = await getpix(poses[i]); 
        let s = JSON.stringify(p);
        s = s.substring( 1, s.length-1);
        s = s.replaceAll('"', '');
        let pix = s.split(",");
        if (parseInt(pix[0])>0) {
            let pixel = await pixelByPos(parseInt(pix[0])); 
            if (pixel) { changePixel(pixel, pix[1], pix[2], pix[3], parseInt(pix[4])); }
            else { createPixel(parseInt(pix[0]), pix[1], pix[2], pix[3], parseInt(pix[4])); }
        }
    }
}
async function pixelByPos(pos) {
    const Pixel = Moralis.Object.extend("Pixel");
    const query = new Moralis.Query(Pixel);
    query.equalTo("pos", pos);
    const results = await query.find(); 
    if (results.length > 0) { return results[0]; }
    else { return false; }
}
async function changePixel(pix, color, url, owner, price) {
    pix.set('colorr', color);
    pix.set('url', url);
    pix.set('owner', owner);
    pix.set('price', price);
    await pix.save();
    console.log("changePixel: pos=" + pix.get('pos'));
}
async function createPixel(pos, color, url, owner, price) {
    const Pixel = Moralis.Object.extend("Pixel");
    const p = new Pixel();
    console.log(p);
    p.set('pos', pos);
    p.set('colorr', color);
    p.set('url', url);
    p.set('owner', owner);
    p.set('price', price);
    await p.save();
    console.log("createPixel: pos=" + p.get('pos'));
}
async function getPixels() {
    let getpix = []
    const Pixel = Moralis.Object.extend("Pixel");
    const query = new Moralis.Query(Pixel);
    query.greaterThan("pos", 0);
    const pixels = await query.find(); 
    for (var i=0; i<pixels.length; i++) {
        let p = pixels[i];
        getpix.push([parseInt(p.get('pos')), (p.get('pos')-1) % xs, parseInt(p.get('pos') / xs), p.get('colorr'), p.get('url'), p.get('owner'), p.get('price')]);
        let x = (p.get('pos')-1) % xs;
        let y = parseInt((p.get('pos')-1-x) / xs);
        color[x][y] = p.get('colorr'); 
        url[x][y] = p.get('url');
        price[x][y] = p.get('price');
    }
    return color;
}
// отрисовка картинки
async function drawPixels() {
    //console.log("in drawpix 0/0 = " + pix[0][0]);
    color = await getPixels();
    for(var x = 0; x < xs; x++) {
        for(var y = 0; y < ys; y++) {
            ctx.fillStyle = color[x][y];
            if (x==1 && y==0) { console.log(color[x][y]); }
            ctx.fillRect(x * ps, y * ps, ps, ps);
        }
    }
}
document.getElementById("board").addEventListener("click", function (e) {
    if (editmode && !screenmode) {
        getpiccoords();
        let cx = Math.min(Math.max(e.clientX - 5*ps, picx), picx + picw - 10*ps);
        let cy = Math.min(Math.max(e.clientY - 5*ps, picy), picy + pich - 10*ps);
        console.log("cursor coords: " + cx + "|" + cy);
        drawCursor(cx, cy);
        if (cy > 600) {savemenuy = cy - 150; } else {savemenuy = cy + 20; }
        if (cx > 700) {savemenux = cx - 250; } else {savemenux = cx + 20; }
        console.log("savemenu coords: " + savemenux + "|" + savemenuy);
        document.getElementById("savemenu").style.left = savemenux + "px";
        document.getElementById("savemenu").style.top  = savemenuy + "px";
        message("<b>paint mode:</b> click on segment to edit it");
    }
    if (lookmode) {
        let px = parseInt((e.clientX - picx) / ps); // pixel coords
        let py = parseInt((e.clientY - picy) / ps);
        if (url[px][py] != "") {win = window.open("https://" + url[px][py]);}
    }
})
document.getElementById("board").addEventListener("mousemove", function (e) {
    if (lookmode) {
        let px = parseInt((e.clientX - picx) / ps); // pixel coords
        let py = parseInt((e.clientY - picy) / ps);
        console.log("pixel url: " + url[px][py]);
        
        for(var x = 0; x < xs; x++)  {
            for (var y = 0; y < ys; y++) {
                if (url[x][y] == prevurl) {
                    ctx.fillStyle = color[x][y];
                    ctx.fillRect(x * ps, y * ps, ps, ps);
                }
                if (url[x][y] == url[px][py] && url[px][py] != "") {
                    //console.log("same url: " + x + "|" + y);
                    ctx.fillStyle = "white";
                    ctx.fillRect(x * ps, y * ps, ps, ps);
                }
            }
        }
        prevurl = url[px][py];
        if (url[px][py]=="") { message("."); }
        else { message("https://" + url[px][py]); }
    }
})

function drawCursor(x, y) {
    crsx = parseInt((x - picx)/ps); // pixel coords
    crsy = parseInt((y - picy)/ps);
    console.log("cursor pixel coords: " + crsx + "|" + crsy);
    if (editmode) {
        document.getElementById("cursor").style.top = y + "px";
        document.getElementById("cursor").style.left = x + "px";
        crs.strokeStyle = "red";
        crs.strokeRect(0, 0, 10*ps, 10*ps);
        show("cursor");
    }
}

document.getElementById("cursor").addEventListener("dblclick", function() {
    console.log("cursor click");
    screenmode = true;
    show("savemenu");
    for (var i=0; i<10; i++) {
        scrpix[i] = new Array(10);
        for (var j=0; j<10; j++) {
            scrpix[i][j] = '';
        }
    }
    drawScreen();
    getpiccoords();
})
function drawScreen() {
    if (editmode) {
        for (var i = 0; i<10; i++) {
            for (var j = 0; j<10; j++) {
                if (scrpix[i][j] != '') {
                    scr.fillStyle = scrpix[i][j];
                } 
                else { scr.fillStyle = color[i+crsx][j+crsy];}
                scr.fillRect(i*screenwidth, j*screenwidth, screenwidth, screenwidth);
        
            }
        }
    }
}
document.getElementById("edit").addEventListener("click", function (e) {
    if (lookmode){
        topaintmode();
        paintcommand = "";
        pricecommand = 0;    
        markedcount  = 0;
        getpiccoords();
    }
    message("edit mode: click on board to choose segment for painting");
    console.log("edit mode=" + editmode + ", markedcount=" + markedcount);
})
document.getElementById("cursor").addEventListener("mousedown", function() { cursortaken = true })
document.getElementById("cursor").addEventListener("mouseup", function() { cursortaken = false })
document.getElementById("cursor").addEventListener("mousemove", function(e) { 
    if (cursortaken) {
        getpiccoords();
        let cx = Math.min(Math.max(e.clientX - 5*ps, picx), picx + picw - 10*ps);
        let cy = Math.min(Math.max(e.clientY - 5*ps, picy), picy + pich - 10*ps);
        console.log("cursor coords: " + cx + "|" + cy);
        drawCursor(cx, cy);
    }
})

document.getElementById("cursor").addEventListener("dblclick", function() {
    console.log("cursor dblclick");
    screenmode = true;
    show("savemenu");
    for (var i=0; i<10; i++) {
        scrpix[i] = new Array(10);
        for (var j=0; j<10; j++) { scrpix[i][j] = ''; }
    }
    drawScreen();
    getpiccoords();
})

document.getElementById("screen").addEventListener("click", function(e) { 
    let scrcoords = document.getElementById("screen").getBoundingClientRect();
    let px = parseInt((e.clientX - scrcoords.left)/screenwidth);
    let py = parseInt((e.clientY - scrcoords.top)/screenwidth);
    if ((markedcount<(maxpixcount+1) && scrpix[px][py] != '') || (markedcount<maxpixcount && scrpix[px][py] == '')){
        if (scrpix[px][py] == '') {
            console.log("screencolor=" + screencolor);
            scrpix[px][py] = screencolor; } else { scrpix[px][py] = ''; }
        if (scrpix[px][py] != '') {
            markedcount++;
            pricecommand = pricecommand + price[px+crsx][py+crsy];
            scr.fillStyle = scrpix[px][py];
            scr.fillRect(px*screenwidth, py*screenwidth, screenwidth, screenwidth);
        }
        else {
            markedcount--;
            pricecommand = pricecommand - price[px+crsx][py+crsy];
            scr.fillStyle = color[px+crsx][py+crsy];
            scr.fillRect(px*screenwidth, py*screenwidth, screenwidth, screenwidth);
        }
        console.log("marked: " + markedcount);
        console.log("screen click: " + px + "|" + py);   
        markedpos = []
        markedcol = []
        let l = 0; 
        for (var i=0; i<10; i++) {
            for (var j=0; j<10; j++) {
                if (scrpix[i][j] != '') {
                    markedpos[l] = (i+crsx)+(j+crsy)*xs + 1;
                    markedcol[l] = scrpix[i][j];
                    l++; 
                };
            }
        }
        //paintcommand = marked.join("|");
        console.log("pos: " + markedpos);
        console.log("col: " + markedcol);
        message("marked pixes: " + markedcount + " total price: " + toBNB(parseInt(pricecommand*101/100))); 
    }
    else { message("max " + (maxpixcount) + " pixels per painting"); }
})
function toBNB(b) {
    let s = String(b);
    if (s.length > 18) { s = s.substring(0, s.length-18) + "." + s.substring(s.length-18); }
    else {
        s = '0'.repeat(19-s.length) + s;
        s = s.substring(0, s.length-18) + "." + s.substring(s.length-18); }
    return 'BNB' + s;
}
document.getElementById("color").addEventListener("change", function() {
    if (screenmode) {
    screencolor = document.getElementById("color").value;
    drawScreen(); }
})
 
document.getElementById("closescreen").addEventListener("click", function() { tolookmode(); })
// save##################################################################################################
document.getElementById("save").addEventListener("click", async function () {
    hide("savemenu");
    lookmode    = false;
    editmode    = false;
    urlcommand  = document.getElementById("url").value; 
    hide("cursor"); 
    console.log("action: save" + markedpos + " " + markedcol );
    const ABI = [
        {
          constant: true,
          inputs: [
			{
				internalType: "uint24[]",
				name: "_pos",
				type: "uint24[]"
			},
			{
				internalType: "string[]",
				name: "_color",
				type: "string[]"
			},
			{
				internalType: "string",
				name: "_url",
				type: "string"
			}
		],
		name: "paint",
		outputs: [],
		stateMutability: "payable",
		type: "function"
        }
    ];
    const options = {
        contractAddress: contract,
        functionName: "paint",
        abi: ABI,
        params: {
          _pos: markedpos,
          _color: markedcol,
          _url: urlcommand
        },
        msgValue: parseInt(pricecommand*(100+masterfee)/100),
    };
    try {
        const paintresult = await Moralis.executeFunction(options);
        console.log(JSON.stringify(paintresult));
        message("saccessful painting"); 
        await updatePixels(markedpos);
        drawPixels();
    }
    catch (e) { 
        message("failed painting");
        console.log(e);
    }
    tolookmode();
});
// refresh
document.getElementById("refresh").addEventListener("click", function(e){
    if (lookmode) {
        console.log("refreshed");
        drawPixels();
        getpiccoords();
        message("look mode: refreshed");
    }
})

async function toLoggedIn() {
    console.log("loggedIn mode");
    hide("login");
    user = await Moralis.User.current();
    document.getElementById("loginmessage").innerHTML = user.get("ethAddress");
    show("logout");
}
function toLoggedOut() {
    console.log("loggedOut mode");
    show("login");
    document.getElementById("loginmessage").innerHTML = "not logged in";
    hide("logout");
}
async function loggerIn () {    
    user = await Moralis.User.current();
    //console.log("user=" + user.get("ethAddress"));
    if (isUndefined(user)) { toLoggedOut(); }
    else { toLoggedIn(); }
}

if(canvas.getContext){
    canvas.width = xs*ps;
    canvas.height= ys*ps;
    cursor.width = 10*ps;
    cursor.height= 10*ps;
    screen.width = 10*10;
    screen.height= 10*10;

    //document.body.style.overflow = 'hidden';

    getpiccoords();
 
    var ctx = canvas.getContext("2d")
    var crs = cursor.getContext("2d")
    var scr = screen.getContext("2d")

    drawCursor(); 
    drawPixels(); 

    loggerIn();


}

 
