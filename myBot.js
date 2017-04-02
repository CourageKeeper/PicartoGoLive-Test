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

//The config is the basic configuration file for the bot itself, including global refresh rate and login key
const config = require("./config.json");
const refreshRate = config.refreshRate;
client.login(config.token);
const listOfServers = require(config.servers);

//Global Variables
var serversArray = null;//This will hold the server keys from the client itself
var serverStateCollection = new Collection();//This holds the online/offline states for streamers for all servers.

/*
* This function tries to load the config file for any given server. It will check to ensure
* that the config file exists and that the config file contains the "streamers" array for use
* later when reading Streamer IDs and API links. Console.logs left commented out for use when
* making an error log file in the future.
*/
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

/*
* Client.on initializes the client and performs a few startup operations.
* serversArray pulls a list of all the servers the bot is a member of.
* The for loop iterates through all the servers in servers.json and all the streamers, initializing their
* online state to "false". May be worth getting the online state directly from API if the number of users goes up
*/
client.on('ready', () => {
  console.log('Loading...');
  serversArray = client.guilds.keyArray();// ACTUAL Discord servers that the bot is a member of
  if(serversArray.length !== listOfServers.servers.length){
    console.log("Joined (" + serversArray.length + ") and configured (" + listOfServers.servers.length + ")  servers mismatch");
  }

  for(i = 0; i < listOfServers.servers.length; i++) { //TODO replace with serversArray.length, current setting is for testing only

    var serverConfig = getServerConfiguration(listOfServers.servers[i].config, i);
    if (serverConfig === null) continue;

    var nameAndState = new Collection();
    for(n = 0; n < serverConfig.streamers.length; n++){
      nameAndState.set(serverConfig.streamers[n].name, false);
    }//endof n for loop for iterating streamers and setting states
    serverStateCollection.set(listOfServers.servers[i].id, nameAndState); //Collection(ID, {streamer.name, STATE})

    /*
    serverStateCollection.forEach(function(value, key) {
      console.log("Iter: " + key + ' = ' + value);
      value.forEach(function(value2, key2) {
        console.log("Iter2: " +key2 + ' = ' + value2);
        });
      });
      */
  }//endof i for loop for iterating servers

  console.log('Ready!');
});//endof Ready! function

/*
* Automatically reconnect if the bot disconnects due to inactivity
* Disconnect code courtesy https://github.com/Zamiell
*/
client.on('disconnect', function(erMsg, code) {
    console.log('----- Bot disconnected from Discord with code ', code, ' for reason: ', erMsg, ' -----');
    client.connect();
});
/*
* This performs API calls for every streamer with valid API links to determine if they are online, then
* posts a message in the bot channel designated by that server file if the online state has changed.
*/
setInterval(() => {
  for(i = 0; i < listOfServers.servers.length; i++){//Iterate through all servers in servers.json Directory

    let guild = client.guilds.get(listOfServers.servers[i].id);
    if(guild === undefined) {//Undefine occurs if there is an ID that doesn't match a server the client has access to.
      continue;
    }

    var servConfig = getServerConfiguration(listOfServers.servers[i].config, i);
    if (servConfig === null) continue;

    var nameAndState = new Collection();

    for(n = 0; n < servConfig.streamers.length; n++){//Loop to get each streamer's status and post messages

      try {
        request.open('GET', servConfig.streamers[n].APILink, false);
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
            nameAndState.set(servConfig.streamers[n].name, true);
            guild.channels.get(servConfig.botChannelID).sendMessage("@here " + reply.channel + " is now streaming! Check it out here: " + servConfig.streamers[n].streamLink);
          }
          else {//if going offline, say goodbye!
            nameAndState.set(servConfig.streamers[n].name, false);
            guild.channels.get(servConfig.botChannelID).sendMessage(reply.channel + " has gone offline, thanks for watching!");
          }
        }
        else{
          nameAndState.set(servConfig.streamers[n].name, reply.is_online);
        }

      }//endof if(request.status == 200)
    }//EndOF loop to iterate through API calls for streamers

    serverStateCollection.set(listOfServers.servers[i].id, nameAndState);

  }//endof for loop to iterate through servers
}, refreshRate);


//Handles the joining of new members
/*
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
*/

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
