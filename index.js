//THIS IS THE SCRIPT FOR THE SERVER-SIDE OF THE VENDING MACHINE. ALL THIS REALLY DOES IS START A SERVER AND HANDLE ON/OFF COMANDS SENT BY THE CLIENT (THE BROWSER WINDOW). 

//THE STAUTS LED IS NOT CONTROLED BY THE BROWSER, AS ISSUES MAY INCLUDE "SERVER FAILURE"
//I USED NODE.JS FOR THIS PROJECT BECAUSE I WANTED A "AMAZING" LOOKING WEB INTERFACE THAT COULD BE CONTROLED BY A DISPLAY CONNECTED TO THE PI OR A EXTERNAL DEVICE CONNECTED TO THE SAME WIFI NETWORK.
//THE "NORMAL" WAY OF DOING THIS WOULD BE TO USE PYTHON AND HAVE A PSYICAL BUTTON BASED CONTROLL, BUT I THOUGHT IT WOULD BE COOL IF IT HAD A FULL CUSTOM INTERFACE.
//I ALSO LIKE THE WEB INTERFACE BECAUSE I HAVE GOOD EXPERENCE WITH HTML AND THERE ARE MANY APIs AVALABLE THROUGH BROWSERS.
//MY ORIGINAL IDEA FOR THIS WAS TO MAKE A VENDING MACHINE FOR DISTRIBUTING HALOWEEN CANDY. I PROGRAMED IT SO YOU HAD TO SAY "TRICK OR TREAT" TO ACTIVATE THE VENDING MACHINE.
//THE WEB INTERFACE ALSO PROVIDES OPPERTUNITY FOR THINGS LIKE USB CREDIT CARD READERS. I DO NOT PLAN ON DOING THIS, BUT IT WOULD BE REALLY COOL!!




//INT. AND DEFINE SOCKET-IO, HTTP SERVER
var http = require('http').createServer(handler); //require http server, and create server with function handler()
var fs = require('fs'); //require filesystem module
var io = require('socket.io')(http) //require socket.io module and pass the http object (server)

//OPEN CHROMIUM IN KIOSK MODE
const { exec } = require('child_process');
exec('sudo -u user2 snap run chromium -kiosk http://localhost:8080', (err, stdout, stderr) => {
  //if (err) {
    // node couldn't execute the command
   // return;
  //}
  console.log(`stdout: ${stdout}`);
  console.log(`stderr: ${stderr}`);
});



//LOAD ARRAY GPIO (GPIO CONTROLLER)
const r = require('array-gpio'); //THERE WAS SOME ISSUE WITH THIS, I AM NOT SURE WHAT IT WAS OR WHY IT WAS CAUSED, BUT I HAD TO USE 2 VARYABLES FOR array-gpio
const rr = require('array-gpio');


//SETUP PINS
let lightsensor = r.in(3); //STOP SENSOR
let motor1 = r.out(5);//MOTOR CONTROL 1
let motor2 = rr.out(7);//MOTOR CONTROL 2
//let motor3 = rr.out(11);//MOTOR CONTROL 3
//let motor4 = rr.out(13);//MOTOR CONTROL 4
let sred = rr.out(15);//STAUTS RED
let sgreen = rr.out(19);//STAUTS GREEN

onoff(0);



//START WEB SERVER
http.listen(8080); //listen to port 8080

function handler (req, res) { //create server
  fs.readFile('/home/user2/vending/vending.html', function(err, data) { //read file index.html in public folder
 
    if (err) {
      res.writeHead(404, {'Content-Type': 'text/html'}); //display 404 on error
      return res.end("404 Not Found");
    }
    res.writeHead(200, {'Content-Type': 'text/html'}); //write HTML
    res.write(data); //write data from index.html
    return res.end();
  });
}



//FUNCTION TO HANDLE/TRIGGER MOTOR ON/OFF AND STAUTS LED
function stat(x) {
 if (x == "NORMAL") { //NORMAL STATE
    sgreen.on();
    sred.off();
      return false;
  }
  else if (x == "ERROR") { //ERROR
	  sgreen.off();
    sred.on();
}
  else if (x == "BUSY") { //BUSY
	  sgreen.on();
	  sred.on();
}
else if (x == "OFF") { //ERROR
	  sgreen.off();
	  sred.off();
}
    
    
      else 
      console.log(`Invalid Stat "`+x+`"`);
  return false;
}


function onoff(x) { //WHEN RELAY IS ADDED, ON AND OFF ARE OPPOSITE
 if (x == "0") { //OFF STATE
    motor1.on();
    motor2.on();
    stat("NORMAL");
      return false;
  }
  else if (x == "1") { //MOTOR 1
    motor1.off();
    motor2.on();
    stat("BUSY");
      return false;
  }
  else if (x == "2") { //MOTOR 2
  motor1.on();
    motor2.off();
    stat("BUSY");
      return false;
  }
 else if (x == "3") { //MOTOR 3
console.log("3: N/A"); //NO MOTORS ARE CONNECTED!
stat("BUSY");
      return false;
  }
  else if (x == "4") { //MOTOR 4
 console.log("4: N/A"); //NO MOTORS ARE CONNECTED!
 stat("BUSY");
      return false;
  }
      else 
      console.log(`There was an error when trying to turn on motor "`+x+`". Check function "onoff()".`);
      stat("ERROR");
  return false;
}



//START SOCKET-IO CONNECTION
io.sockets.on('connection', function (socket) {// WebSocket Connection
lightsensor.watch((state) => {

if(state == true){
    socket.emit('light', "button"); //SEND A SIGNAL TO THE CLIENT (WEBSITE) THAT 
    stat("NORMAL");
  }
  if(state == false){
  //Don't do anything
  //MORE INFO ON THE PLAN BEHIND THIS: Lets say a light beam sensor was connected. Because we don't want to be able to turn on the motor from the sensor (we need the sensor to tell the motor when to stop). In other words, when the switch is pushed in (false value), then the light beam is broken, and a piece of candy has fallen. When the person removes the candy, the beam will be restored we don't want to start the motor again.
  }
});


//RUN THE ON/OFF FUNCTION WHEN MOTOR DATA IS RECEIVED
  socket.on('light', function(data) {
    onoff(data);
    } 
    );
    //SIMPLE AND MOSTLY SECURE LOGIN SYSTEM
    //IF CORRECT CODE RECEIVED, CHECK IF CORRECT, THEN SEND BACK THAT IT IS TRUE.
    socket.on('code', function(data) {
    var ccode = "1234"; //CHANGE THIS NUMBER TO CHANGE CODE: THE ADMIN PASSWORD
    if (data == ccode) {
      socket.emit('code', "logintrue");
    }

    //IF CORRECT CODE RECEIVED WITH COMMAND... RUN THESE COMMANDS...
    //BROWSER SENDS THE CODE AND THE COMMAND. (LIKE THIS: "1234shutdown")
    //IF DATA = CODE AND COMMAND, THEN...
  else if (data == ccode+"shutdown") {
      socket.emit('code', "shutdown");
      console.log("SHUT DOWN");
      stat("ERROR");
      exec('sudo shutdown -h now', (err, stdout, stderr) => {
  console.log(`stdout: ${stdout}`);
  console.log(`stderr: ${stderr}`);
});
  }
  else if (data == ccode+"restart") {
      socket.emit('code', "restart");
      console.log("restart");
      stat("ERROR");
      exec('sudo restart', (err, stdout, stderr) => {
  console.log(`stdout: ${stdout}`);
  console.log(`stderr: ${stderr}`);
});
  }
   else if (data == ccode+"killchromium") {
	   stat("ERROR");
      socket.emit('code', "killchromium");
      console.log("KILL CHROMIUM");
	//OLD: sudo killall snap run chromium
      exec('sudo killall chrome', (err, stdout, stderr) => {
  console.log(`stdout: ${stdout}`);
  console.log(`stderr: ${stderr}`);
});
  }
  else if (data == ccode+"chromium") {
      socket.emit('code', "openchromium");
      console.log("OPEN CHROMIUM");
      exec('sudo -u user2 /snap/bin/chromium -kiosk http://localhost:8080', (err, stdout, stderr) => {
  console.log(`stdout: ${stdout}`);
  console.log(`stderr: ${stderr}`);
});
  }
  else if (data == ccode+"thonny") {
      socket.emit('code', "thonny");
      console.log("OPEN THONNY");
      exec('sudo thonny', (err, stdout, stderr) => {
  console.log(`stdout: ${stdout}`);
  console.log(`stderr: ${stderr}`);
});
  }
      else if (data == ccode+"kill") {
		  stat("OFF"); //TURN THE LED RED
      socket.emit('code', "kill");
      console.log("KILL SERVER");
      
      exec('sudo killall chrome', (err, stdout, stderr) => {
  console.log(`stdout: ${stdout}`);
  console.log(`stderr: ${stderr}`);
});
      
      
      onoff(0);  // Turn Motors off
console.log("");
  console.log("Vending Machine Exited: Killed by HTML Button");
  process.exit(); //exit completely (Quit this script)
  }
  
  //IF CODE WRONG OR FUNCTION WRONG
    else 
    socket.emit('code', "wrong");
      console.log("Invalid Code and/or Function: '"+data+"'");
    }
  );
});


//KILL FUNCTION - WHEN CTRL+C IN COMMAND LINE
process.on('SIGINT', function () {
	stat("OFF");
  //LED.writeSync(0); // Turn LED off
  //LED.unexport(); // Unexport LED GPIO to free resources
  //pushButton.unexport(); // Unexport Button GPIO to free resources
  onoff(0);  // Turn LED off
console.log("");
  console.log("Vending Machine Exited");
  process.exit(); //exit completely (Quit this script)
})
