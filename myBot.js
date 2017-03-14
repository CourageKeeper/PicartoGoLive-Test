const Discord = require('discord.js');
const client = new Discord.Client();

const config = require("./config.json");

const botChannelName = config.botChannelName;


//new HTML request info
const fs = require("fs");
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const APILink = config.APILink;
const refreshRate = config.refreshRate;
var request = new XMLHttpRequest();
//End of HTML stuff

client.on('ready', () => {
  console.log('Loading...');

  //new HTML request info
  request.open('GET', APILink, false);
  request.send(null);
  if(request.status == 200){

    var reply = JSON.parse(request.responseText);
    console.log("Get status: " + reply.is_online);
    /*
    fs.writeFile("API.json", reply, (error) => {

      if (error) console.log("Error writing to file.");
      else console.log("API file written.");
    });
    //console.log(request.responseText);
    */
  }
  //End HTML stuff
  console.log('Ready!');
});

//Timer for checking the online states
/*
setInterval(() => {

}, refreshRate);
*/

//Handles the joining of new members
client.on("guildMemberAdd", member => {
  let guild = member.guild;
  let guildChannelsKeys = guild.channels.keyArray();
  let botChannelID = guild.defaultChannel.id;

  //Find the botChannelName channel ID
  for(i = 0; i < guildChannelsKeys.length; i++) {
    if(guild.channels.get(guildChannelsKeys[i]).name === botChannelName) {
      botChannelID = guild.channels.get(guildChannelsKeys[i]).id;
      i = guildChannelsKeys.length;
    }
  }
  guild.channels.get(botChannelID).sendMessage(`Welcome ${member.user} to ${guild.name}!`);

  //console.log(botchannel);
  //guild.defaultChannel.sendMessage(`Welcome ${member.user} to ${guild.name}!`);
});

//Message contains the actions the bot can take in response to a user's message
client.on('message', message => {
  if (message.author.bot) return; //Don't reply to bots
  if (!message.content.startsWith(config.prefix)) return; //Only look for bot commands

  let command = message.content.split(" ")[0];
  command = command.slice(config.prefix.length);

  let args = message.content.split(" ").slice(1);

  if (command === "say") {
    message.channel.sendMessage(args.join(" ")); return;
  }

  if (command === "f") {
    message.channel.sendMessage("Fuck " + args[0]); return;
  }

  if (command == "add") {
    let numArray = args.map(number => parseInt(number));
    let sum = 0;
    for(i = 0; i < args.length; i++) {
      if (args[i] != "+"){
        sum += parseInt(args[i]);
      }
    }
    if (isNaN(sum)) {
      message.channel.sendMessage("Please only use numbers."); return;
    }
    else message.channel.sendMessage("The sum is: " + sum); return;
  }

  if (command === "ping") {
    message.channel.sendMessage('pong'); return;
  }

});

client.login(config.token);
