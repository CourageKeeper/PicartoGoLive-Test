/**
* A Bot that will notify a Discord server when a streamer goes live on Picarto.
*/
//Require frameworks needed for code to function
const Discord = require("discord.js");
const Collection = require("discord.js/src/util/Collection.js");
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const fs = require("fs");

//Primary constructors
const client = new Discord.Client();
var request = new XMLHttpRequest();

const config = require("./config.json");
const refreshRate = config.refreshRate;
client.login(config.token);

const listOfServers = require("./servers.json");

//temp
/*
var servConfig = require("./serverConfig/NERV_HQ.json");
//TODO redo these from config into server config
const botChannelName = servConfig.botChannelName;
const botChannelID = servConfig.botChannelID;
const APILink = servConfig.APILink;
const streamLink = servConfig.streamLink;
*/

//Global Variables
var serversArray = null;
var serverStateCollection = new Collection();//This holds the online/offline states for servers.

function getServerConfiguration(configLocation, serverNumber) {
  try {
    var serverConfig = require(configLocation);

    if(serverConfig === undefined) {
      //console.log("Server number: " + listOfServers.servers[i] + " in dictionary has an undefined config.json.");
      return null;
    }

    if(serverConfig.streamers === undefined) {
      //console.log("Server config: " + listOfServers.servers[i].config + " is missing streamers construct");
      return null;
    }

    return serverConfig;
  }
  catch (err) {
    //console.log("An error has occured with server: " + serverNumber + " configuration.");
    return null;
  }
}//End of getServerConfiguration function

client.on('ready', () => {
  console.log('Loading...');
  serversArray = client.guilds.keyArray();// ACTUAL Discord servers that the bot is a member of

  for(i = 0; i < listOfServers.servers.length; i++) { //TODO replace with serversArray.length, current setting is for testing only
    //console.log("In I loop - I is: " + i);

    var serverConfig = getServerConfiguration(listOfServers.servers[i].config, i);
    if (serverConfig === null) continue;
    /*
    try {
      var serverConfig = require(listOfServers.servers[i].config);
      if(serverConfig === undefined) {
        console.log("Server number: " + listOfServers.servers[i] + " in dictionary has an undefined config.json.");
        continue;
      }
      if(serverConfig.streamers === undefined) {
        console.log("Server config: " + listOfServers.servers[i].config + " is missing streamers construct");
        continue;
      }
    }
    catch (err){
      //console.log(err);
      continue;
    }
    */

    for(n = 0; n < serverConfig.streamers.length; n++){
      var nameAndState = new Collection();
      nameAndState.set(serverConfig.streamers[n].name, false);
      serverStateCollection.set(serversArray[i], nameAndState); //Collection(ID, {streamer.name, STATE}) //What I HOPE is happening
    }//endof n for loop for iterating streamers and setting states
  }//endof i for loop for iterating servers
  //console.log("Number of servers in directory: " + listOfServers.servers.length); //Servers the bot has configurations for

  console.log('Ready!');
});//endof Ready! function

//Timer for checking the online states
setInterval(() => {
  for(i = 0; i < listOfServers.servers.length; i++){//Iterate through all servers in servers.json Directory

    let guild = client.guilds.get(listOfServers.servers[i].id);
    if(guild === undefined) {//Undefine occurs if there is an ID that doesn't match a server the client has access to.
      //console.log("Bad server id, or trying to access server the bot does not have access to. Server number: " + i + " named: " + listOfServers.servers[i].name);
      continue;
    }

    var servConfig = getServerConfiguration(listOfServers.servers[i].config, i);
    if (servConfig === null) continue;
    /*
    try {//This will fail if the configuration file is missing
      var servConfig = require(listOfServers.servers[i].config);
    } catch (err) {
      console.log("Bad or missing configuration file at position: " + i + " named: " + listOfServers.servers[i].name);
      continue;
    }
    //TODO try/catch  reading the rest of the server config file
    */

    for(n = 0; n < servConfig.streamers.length; n++){//Loop to get each streamer's status and post messages

      try {
        request.open('GET', servConfig.streamers[n].APILink, false); //TODO APILink needs to be specific to the server config!
      }
      catch (err) {
        console.log("An error has occured getting the API link:");
        console.log(err);
        continue;
      }
      request.send(null);
      if(request.status == 200){
        var reply = JSON.parse(request.responseText);

        if(reply.is_online !== serverStateCollection.get(listOfServers.servers[i].id).get(servConfig.streamers[n].name)) { //if there has been a change
          if(reply.is_online){ //if going to online, post about it and set state to online

            var nameAndState = new Collection();
            nameAndState.set(servConfig.streamers[n].name, true);
            serverStateCollection.set(listOfServers.servers[i].id, nameAndState);

            guild.channels.get(servConfig.botChannelID).sendMessage("@here " + reply.channel + " is now streaming! Check it out here: " + servConfig.streamers[n].streamLink);
          }
          else {//if going offline, say goodbye!
            var nameAndState = new Collection();
            nameAndState.set(servConfig.streamers[n].name, false);
            serverStateCollection.set(listOfServers.servers[i].id, nameAndState);
            guild.channels.get(servConfig.botChannelID).sendMessage(reply.channel + " has gone offline, thanks for watching!");
          }
        }
      }//endof if(request.status == 200)

    }//EndOF loop to iterate through API calls for streamers */


      /*request.open('GET', APILink, false); //TODO APILink needs to be specific to the server config!
      request.send(null);
      if(request.status == 200){
        var reply = JSON.parse(request.responseText);

        if(reply.is_online !== serverStateCollection.get(listOfServers.servers[i].id)) { //if there has been a change
          if(reply.is_online){ //if going to online, post about it and set state to online
            serverStateCollection.set(listOfServers.servers[i].id, true);
            guild.channels.get(botChannelID).sendMessage("@here " + reply.channel + " is now streaming! Check it out here: " + streamLink);
          }
          else {//if going offline, say goodbye!
            serverStateCollection.set(listOfServers.servers[i].id, false);
            guild.channels.get(botChannelID).sendMessage(reply.channel + " has gone offline, thanks for watching!");
          }
        }
      }//endof if(request.status == 200) */

  }//endof for loop to iterate through servers
}, refreshRate);


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
