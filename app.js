const express = require('express')
const app = express();
const serv = require('http').Server(app)
const io = require('socket.io')(serv,{})
var socketList ={};
var playerList={}
app.get('/',(req,res)=>{
  res.sendFile(__dirname + '/client/index.html')
})
app.use('/client',express.static(__dirname+'/client'))
serv.listen(2000)
console.log("Server Started")
class Entity{
  constructor(){
    this.x = 250;
    this.y = 250;
    this.spdX=0;
    this.spdY = 0;
    this.id=''
  }
  update(){
    this.updatePosition()
  }
  updatePosition(){
    this.x+=this.spdX;
    this.y+=this.spdY;
  }
}
class Player extends Entity{
  constructor(id){
    super();
    this.x = 250;
    this.y = 250;
    this.id =id;
    this.number = ""+Math.floor(10*Math.random())
    this.pressingRight = false;
    this.pressingLeft = false;
    this.pressingUp = false;
    this.pressingDown = false;
    this.maxSpd = 10;
    Player.list[id]=this;
  }
  update(){
    this.updateSpd()
    super.update();
  }
  updateSpd(){
    if(this.pressingRight){
      this.x+=this.maxSpd;
    }
    if(this.pressingLeft){
      this.x-=this.maxSpd
    }
    if(this.pressingUp){
      this.y-=this.maxSpd
    }
    if(this.pressingDown){
      this.y+=this.maxSpd;
    }
  }
  static pack(){
    let pack = []
    for(let i in Player.list){
      let player = Player.list[i];
      player.updateSpd()
      pack.push({
        x:player.x,
        y:player.y,
        number:player.number,
      })
    }
    return pack;
  }
  static onConnect(socket){
    let player = new Player(socket.id)
    socket.on('keyPress',(data)=>{
    if(data.inputId ==='left'){
      player.pressingLeft=data.state;
    }else if(data.inputId ==='right'){
      player.pressingRight=data.state;
    }else if(data.inputId ==='up'){
      player.pressingUp=data.state;
    }else if(data.inputId ==='down'){
      player.pressingDown=data.state;
    }
    })
  }
  static onDisconnect(socket){
    delete Player.list[socket.id]
  }
}
Player.list={};

io.sockets.on('connection',(socket)=>{
  socket.id = Math.random()
  socketList[socket.id] = socket;
  Player.onConnect(socket)
  socket.on('disconnect',()=>{
      delete socketList[socket.id]
      Player.onDisconnect(socket)
  })
})
setInterval(()=>{
  let pack =Player.pack()
  for(let i in socketList){
    let socket = socketList[i]
    socket.emit('newPosition',pack);
  }
},1000/25)
