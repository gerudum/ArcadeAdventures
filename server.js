const Discord = require('discord.js');
const bot = new Discord.Client();
const http = require('http');
const express = require('express');
const app = express();

const tools = require('./tools.js');

app.get("/", (request, response) => {
  //console.log(Date.now() + " Ping Received");
  response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);

const fs = require('fs');


let party = JSON.parse(fs.readFileSync('.data/instance.json','utf8')); //party
let user = JSON.parse(fs.readFileSync('.data/user.json','utf8')); // Player Stats
let monsters = JSON.parse(fs.readFileSync('configuration/monsters.json','utf8')); //Read Only
let enemies = JSON.parse(fs.readFileSync('.data/enemyInstances.json','utf8')); //Active Enemies
let dungeons = JSON.parse(fs.readFileSync('configuration/dungeons.json',"utf8")); //Read Only
let dungeon = JSON.parse(fs.readFileSync('.data/dungeonInstances.json',"utf8")); //Active Dungeon
let scenarios = JSON.parse(fs.readFileSync('configuration/scenarios.json',"utf8")); //Read Only
let items = JSON.parse(fs.readFileSync('configuration/items.json',"utf8")); //Read Only
let table = JSON.parse(fs.readFileSync('configuration/table.json',"utf8")); //Read Only
let rooms = JSON.parse(fs.readFileSync('configuration/rooms.json',"utf8")); //Read Only
let gate = JSON.parse(fs.readFileSync('.data/gates.json',"utf8")); //Checking if it's time for a new gate.
let status = JSON.parse(fs.readFileSync('configuration/status.json',"utf8")); //Statuses!
let auctions = JSON.parse(fs.readFileSync('.data/auctionHouse.json',"utf8")); //Checking if it's time for a new gate.
let towns = JSON.parse(fs.readFileSync('configuration/towns.json','utf8')); //towns
let moves = JSON.parse(fs.readFileSync('configuration/moves.json',"utf8"));
let admin = JSON.parse(fs.readFileSync('.data/admin.json',"utf8"));

const prefix = "!";
var commands = ["PREFIX = !", "info version", "fight {enemyname}", "forward","check {object}","inventory", "inventory stats", ];
var downTime = 10;
const resources = "https://imgur.com/a/htUgqoA";
var crownLoot = [5,10,15,25,50,100]
var crownWeights = [20,10,10,5,5,2];
//Emoji IDS
var fightEmoji = "567468758294200320";
var supportEmoji = "592488143542812696";
var chargeEmoji = "592488158118019093";
var blockEmoji = "567468785670291456";
var forwardEmoji = "567468996014899240";
var descendEmoji = "567866647369613341";
var inventoryEmoji = "567866805763440640";
var gateEmoji = "567867432300183562";
var specialEmoji = "572159195932262450";
var checkEmoji = "575419820825247754";
var bidEmoji = "569973521124425758";
var buyEmoji = "569973669376426000";
var interactEmoji = "580124031571853325";
var leftpageEmoji = "580905770812702720";
var rightpageEmoji = "580905793939963932";

var removeEmoji = "592810251255021568";
var confirmEmoji = "592810232959205398";

var nextEmoji = "592810321828380673";
var previousEmoji = "592810344439873546";

var increaseEmoji = "592810274373763074";
var decreaseEmoji = "592810290790531088";

var maxDepth = 38;
var heat = [0.33,0.43,0.5,0.55,0.6,0.65,0.7,0.85,0.9,1.00,1.00,1.00]

//On Bot Startup
bot.on('ready', () => {
    //console.log('The Arcade is up and running');
    Log("The Arcade has Rebooted.")
    for (var key in user){
        if(user[key].party > 0 && user[key].partyChannel != null){
          if(bot.channels.get(user[key].partyChannel)){
            RebootInstance(key);
          }       
        }
    }
})

setInterval(function() {
    Update();
    
}, 1000);
//Update is ran every second.
function Update(){
    Gate();
  //  Event();
    Mist();
}
function Mist(){
    if(!gate.mist){
        gate.mist = 600;
    }
    gate.mist -= 1;
    if(gate.mist <= 0){
        for(var key in user){
            user[key].mist += 1;
            if(user[key].mist > user[key].maxMist){
                user[key].mist = user[key].maxMist;
            }
        }
        gate.mist = 600;
    }
}
//#region GateStuff
//Runs every second.  For events.
function Event(){
    if(!gate.event){
        gate.event = 0;
        gate.maxEvent = 1800;
    }
    gate.event += 1;
    if(gate.event >= gate.maxEvent){
        gate.event = 0;
        Log("An event has occured.")
        gate.maxEvent = 1800;
        //Step 1 Get a random depth.
        var depth = Math.floor(Math.random() * maxDepth);
        dungeon.depth[depth] = {};
        var chosenArea = null;

        //Step 2 Generate a New Dungeon.
        chosenArea = CreateLoot(dungeons["Config"].names,dungeons["Config"].weights);
        while(!dungeons[chosenArea].theme.includes(gate.theme[0]) && !dungeons[chosenArea].theme.includes(gate.theme[1])){
            //console.log(chosenArea);
            chosenArea = CreateLoot(dungeons["Config"].names,dungeons["Config"].weights);
        }   

        enemies.depth[depth] = {};
        enemies.depth[depth].location = {};
        dungeon.depth[depth] = GenerateDungeon(chosenArea);

        //Step 3 Set up the enemies.
        for (var i = 0; i < dungeon.depth[depth].currentrooms.length; i++){ 
            enemies.depth[depth].location[i] = {};   
            enemies.depth[depth].location[i].enemy = {};
            enemies.depth[depth].location[i].enemy.health = 0;
        }

        //Step 4 Make sure players are in the right location.
        for(var key in user){
            if(user[key].depth === depth){
                user[key].location = 0;
            }
        }

        //Get Channel and send it.
        var channel = bot.channels.get("579858992814358528");

        //Embed.
        const embed = new Discord.RichEmbed()
        embed.setTitle("Event!")
        embed.addField("Depth " + depth + " has become " + dungeon.depth[depth].name + "!","The clockworks is always changing...")
        channel.send(embed);

    }
}
//Runs every second. For gates.
function Gate(){
    //Gate regeneration time;
    gate.lifeTime += 1;
    gate.maxLife = 14400;

    if(gate.lifeTime > gate.maxLife){
        gate.lifeTime = 0;
      if(!gate.minerals){
        gate.minerals = {}
      }

        //Get the New Theme of the Gate based on minerals
        var newTheme = GetTheme();
        gate.theme = newTheme;

        //Clear all the depths
        dungeon.depth = {};

        //Reset Depths
        for(var i = 0; i < maxDepth; i++){
            dungeon.depth[i] = {};
        }    

        var chosenArea = null;

        for (var key in dungeon.depth){        
            chosenArea = CreateLoot(dungeons["Config"].names,dungeons["Config"].weights);
            while(!dungeons[chosenArea].theme.includes(newTheme[0]) && !dungeons[chosenArea].theme.includes(newTheme[1])){
                //console.log(chosenArea);
                chosenArea = CreateLoot(dungeons["Config"].names,dungeons["Config"].weights);
            }               

            //Set the name
            //The party will generate said dungeon 

            dungeon.depth[key] = chosenArea;
           
        } 

        //Reset Minerals
        for (var key in gate.minerals){
            gate.minerals[key] = 0;
        }
        
        //Reset User Stats
        for(var key in user) {

            user[key].enemy = null;
            user[key].health = user[key].maxHealth;
            user[key].opponent = "Nothing";
            user[key].location = 0;
            user[key].downTime = false;
            user[key].depth = 0;
            try{
                party[user[key].party].dungeon = {};
                party[user[key].party].dungeon = GenerateDungeon(dungeon.depth[user[key].depth]);
                console.log("Dungeon Instantiation Successful! " + "Dungeon Name: " + party[user[key].party].dungeon.name + "Current Rooms: " + party[user[key].party].dungeon.currentrooms);
            } catch(e) {
                console.log("Dungeon Instantiation failed");
            }
           
        } 

        //Get the channel
        var channel = bot.channels.get("579858992814358528");
        var levels = [];

        //Embed
        const embed = new Discord.RichEmbed()
        embed.setTitle("Gate Creation")

        //Depth Dungeon
        for (var key in dungeon.depth){
            levels.push("Depth " + key + ", " + dungeon.depth[key]);
        }

        //Levels
        var stratum1 = [levels[0],levels[1],levels[2],levels[3]];
        var stratum2 = [levels[4],levels[5],levels[6],levels[7]];
        var stratum3 = [levels[8],levels[9],levels[10],levels[11],levels[12]];
        var stratum4 = [levels[13],levels[14],levels[15],levels[16],levels[17]];
        var stratum5 = [levels[18],levels[19],levels[20],levels[21],levels[22]];
        var stratum6 = [levels[23],levels[24],levels[25],levels[26],levels[27]];
        var stratum7 = [levels[28],levels[29],levels[30],levels[31],levels[32]];
        var stratum8 = [levels[33],levels[34],levels[35],levels[36],levels[37]];

        //Stratums
        embed.addField("Stratum 1", stratum1)
        embed.addField("Stratum 2", stratum2)
        embed.addField("Stratum 3", stratum3)
        embed.addField("Stratum 4", stratum4)
        embed.addField("Stratum 5", stratum5)
        embed.addField("Stratum 6", stratum6)
        embed.addField("Stratum 7", stratum7)
        embed.addField("Stratum 8", stratum8)
        embed.addField("The theme is " + gate.theme[0] + " " + gate.theme[1],"Interesting")

        embed.setColor(0xFCF200)

        channel.send(embed);

         //Log it
         Log("A new gate has been generated.")
    }
}
//Check Gate Map
function CheckGate(player){
    //Log it
    Log(user[player].name + " is checking the gate.");
    var levels = [];

        for (var key in dungeon.depth){
            levels.push("Depth " + key + ", " + dungeon.depth[key].name);    
        }

        //Stratums
        var stratum1 = [levels[0],levels[1],levels[2],levels[3]];
        var stratum2 = [levels[4],levels[5],levels[6],levels[7]];
        var stratum3 = [levels[8],levels[9],levels[10],levels[11],levels[12]];
        var stratum4 = [levels[13],levels[14],levels[15],levels[16],levels[17]];
        var stratum5 = [levels[18],levels[19],levels[20],levels[21],levels[22]];
        var stratum6 = [levels[23],levels[24],levels[25],levels[26],levels[27]];
        var stratum7 = [levels[28],levels[29],levels[30],levels[31],levels[32]];
        var stratum8 = [levels[33],levels[34],levels[35],levels[36],levels[37]];
        
        //Minerals
        var minerals = [];
        for (var key in gate.minerals){
            minerals.push(key  + ": " + gate.minerals[key]);
        }
    //Embed
    const embed = new Discord.RichEmbed()

        embed.setTitle("Gate")
        embed.addField("The current dungeon is " + party[user[player].party].dungeon.name, "You have reached room " + (user[player].location + 1) + " out of " + party[user[player].party].dungeon.currentrooms.length + " of this dungeon.")

        embed.addField("You are at depth: " + user[player].depth + " of the current gate", "You have quite a ways to go.")
        embed.addField("There is " + Math.floor((gate.maxLife - gate.lifeTime)/60) + " minutes remaining before the next gate", "Interesting")
        
        if(minerals.length <= 0){
            minerals.push("None, be the first to input minerals!");
        } 

        //Minerals and Stratums, Embed
        embed.addField("Deposited minerals", minerals)
        embed.addField("Stratum 1", stratum1)
        embed.addField("Stratum 2", stratum2)
        embed.addField("Stratum 3", stratum3)
        embed.addField("Stratum 4", stratum4)
        embed.addField("Stratum 5", stratum5)
        embed.addField("Stratum 6", stratum6)
        embed.addField("Stratum 6", stratum7)
        embed.addField("Stratum 6", stratum8)
        embed.addField("The theme is " + gate.theme[0] + " " + gate.theme[1],"Interesting")
        //embed.setThumbnail("https://i.imgur.com/KTD2rHD.png")
        //Update Embed
        StatusAction(embed,player);
}
//Get theme of the gate.
function GetTheme(){
    //Get the minerals
    //Get the Themes
    var crimsonite = gate.minerals["CRIMSONITE"];
    var darkmatter = gate.minerals["DARK MATTER"];
    var luminite = gate.minerals["LUMINITE"];
    var moonstone = gate.minerals["MOONSTONE"];
    var valestone = gate.minerals["VALESTONE"]; 

    //Possible Themes
    var beast = crimsonite + valestone;
    var slime = valestone + luminite;
    var gremlin = crimsonite +  moonstone;
    var construct = moonstone + luminite;
    var fiend = crimsonite + darkmatter;
    var undead = luminite + darkmatter;
    var fire = crimsonite + luminite;
    var freeze = valestone + moonstone;
    var poison = valestone + darkmatter;
    var shock = moonstone + darkmatter;

    //Get the highest number and that's the chosen theme.
    var themes = [beast,slime,gremlin,construct,fiend,undead,fire,freeze,poison,shock];
    ////////console.log(themes);
    var newTheme = Math.max(...themes);
    if(beast === newTheme && slime === newTheme && gremlin === newTheme && construct === newTheme && fiend === newTheme && undead == newTheme && fire === newTheme && freeze === newTheme && shock === newTheme && poison === newTheme){
        newTheme = ["random","none"];
    } else if(beast === newTheme){
        newTheme = ["beast","none"];
    } else if (slime === newTheme){
        newTheme = ["slime","none"];
    } else if (gremlin === newTheme){
        newTheme = ["gremlin","none"];
    } else if (construct === newTheme){
        newTheme = ["construct","none"];
    } else if (fiend === newTheme){
        newTheme = ["fiend","none"];
    } else if (undead === newTheme){
        newTheme = ["undead","none"];
    } else if (fire === newTheme){
        newTheme = ["fire","random"];
    } else if (freeze === newTheme){
        newTheme = ["freeze","random"];
    } else if (shock === newTheme){
        newTheme = ["shock","random"];
    } else if (poison === newTheme){
        newTheme = ["poison","random"];
    } 

    //console.log("This gate's theming is... ",newTheme);
    return newTheme;
}
//Generate a depth.
function GenerateDungeon(area){
    //////console.log("Generating Dungeon..." + area);
    var finalArea = {};
    finalArea.rooms = dungeons[area].rooms;
    finalArea.name = dungeons[area].name;
    finalArea.max = dungeons[area].max;
    finalArea.min = dungeons[area].min;
    
    var maxRooms = 12;
    var minRooms = 4;
   
    
    if(finalArea.max){
        maxRooms = finalArea.max;
    }
    if(finalArea.min){
        minRooms = finalArea.min;
    }
  
    var roomSize = Math.floor(Math.random() * maxRooms);
    if(roomSize <= minRooms){
        roomSize = minRooms;
    }
    ////console.log(roomSize + " Rooms will be in this dungeon");
    if(dungeons[area].rooms.length > 0){
        finalArea.currentrooms = null;
        finalArea.currentrooms = [];
        for(var i = 0; i < roomSize; i++){
            var randIndex = Math.floor(Math.random() * dungeons[area].rooms.length);
            finalArea.currentrooms.push(dungeons[area].rooms[randIndex]);                                                        
        }  
    } else {finalArea.currentrooms = dungeons[area].currentrooms;}
  
    //console.log(area + " " + finalArea.currentrooms);
    return finalArea; 
}
//#endregion
//Check if an array contains something.
function ExamineConditional(state,condition){
    return (state.includes(condition));
}
//Check if the JSON file doesn't have any problems before writing to it.
function isValidString(json){
  try {
    //Stringify the json and then attempt to Parse it.  If the parse fails we won't save the data and should neglect all changes made.
        var check = JSON.stringify(json);
        JSON.parse(check);
        return true;
    } catch (e) {
        return false;
    }
}
//Save .data
function SaveData(){  
  if(isValidString(admin)){
    fs.writeFile('.data/admin.json', JSON.stringify(admin,null,4), (err) =>{
            if (err) console.error(err);
        })
  }
  if(isValidString(enemies)){
    fs.writeFile('.data/enemyInstances.json', JSON.stringify(enemies,null,4), (err) =>{
            if (err) console.error(err);
        })    
  }
  if(isValidString(dungeon)){
    fs.writeFile('.data/dungeonInstances.json', JSON.stringify(dungeon,null,4), (err) =>{
            if (err) console.error(err);
      })   
  }
  if(isValidString(gate)){
     fs.writeFile('.data/gates.json', JSON.stringify(gate,null,4), (err) =>{
            if (err) console.error(err);
      }) 
  }
  if(isValidString(auctions)){
    fs.writeFile('.data/auctionHouse.json', JSON.stringify(auctions,null,4), (err) =>{
            if (err) console.error(err);
      })
  }
  if(isValidString(party)){
    fs.writeFile('.data/instance.json', JSON.stringify(party,null,4), (err) =>{
            if (err) console.error(err);
      })
  }
  if(isValidString(user)){
    fs.writeFile('.data/user.json', JSON.stringify(user,null,4), (err) =>{
            if (err) console.error(err);
        })   
    }     
}
function AttackChance(probability){
    var rand = Math.floor(Math.random() * 100);
    if(rand <= 0){
        rand = 1;
    }
    if(rand <= probability){
        return true;
    } else {
        return false;
    }
}
const arrSum = arr => arr.reduce((a,b) => a + b, 0)
function CreateLoot(loot, weights){
    var top = 0;
    var total = 0;

    total = arrSum(weights);

    var rand = Math.floor(Math.random() * total);
    for(var i = 0; i < loot.length; i++){
        top+=weights[i]; 
        
        if(rand <= top){ 
            return loot[i];                         
        }                 
    }   
}
function DamageScale(weapon,enemy){
    var scaled = 1;
    var base = weapon.damage;
    //console.log(base + " Base Damage");
    if(enemy.weakness === weapon.damageType){
        scaled = Math.round(base * 1.5);
    } else if (enemy.resistance === weapon.damageType){
        scaled = Math.round(base * 0.5);
    } else {
        scaled = Math.round(base);
    }
    //console.log(scaled + " Scaled Damage")
    return scaled;
}
function Heat(player,embed){
    var results = {};
    for(var key in user){
        var myWeapon = user[key].equipment[user[key].equipped];
        var leveling = [];
        if(user[key].party === user[player].party && user[key].location === user[player].location && user[key].depth === user[player].depth){
            if(myWeapon.heat >= myWeapon.maxHeat && myWeapon.level != myWeapon.maxLevel){
                myWeapon.level += 1;
                myWeapon.heat -= myWeapon.maxHeat;
                myWeapon.damage = (myWeapon.base * heat[myWeapon.level]);
            
                leveling.push(user[key].name + ", your weapon has leveled up to level " + myWeapon.level + "!");

                if(myWeapon.level > myWeapon.maxLevel){ myWeapon.level = myWeapon.maxLevel; }

                user[key].equipment[user[key].equipped] = myWeapon;
               
            }
            if(leveling.length > 0){
             embed.addField("Heating",leveling)
            }
           
        }
    }
    results.embed = embed;
    return results; 
}
function Check(object,player){
    //The information we are grabbing.
    Log(user[player].name + " is attempting to check something!")
    if(user[player].location <= 0){
       const failure = new Discord.RichEmbed()
        failure.setTitle("No checking allowed at this location, please move forward.")
        PartyAction(failure,player);
        return;
        
    }
    var check = null;
    for(var key in user){
        if(user[key].name.toUpperCase() === object.toUpperCase()){
            check = key;
        }
    }
    for(var key in user[player].items){
        if(user[player].items[key].name.toUpperCase() === object.toUpperCase()){
            check = user[player].items[key].name;
        }
    }
    if(monsters[object.toUpperCase()] || scenarios[object]){
        check = party[user[player].party].enemies[user[player].opponent];
    }
    if(check === null){
        const failure = new Discord.RichEmbed()
        failure.setTitle("There is nothing with this name to be checked.  Check for capitals and spelling errors. If it's an item, maybe you don't have it.  Or the enemy your are trying to check is already dead.")
        PartyAction(failure,player);
        return;
    }
    const embed = new Discord.RichEmbed()
    embed.setTitle(user[player].name + "'s Check")
    //console.log(check.name);
    if(check === party[user[player].party].enemies[user[player].opponent]){
            embed.addField("You are checking " + check.name, "...")  
        if(check.name.toUpperCase() === "BASIL" || check.name.toUpperCase() === "GRASIL"){
            embed.addField(check.name + " has these recipes in stock.", check.stock)
        } else if (monsters[object.toUpperCase()]) {
            embed.addField(check.name + " can be attacked.",check.name + " has " + check.health + " health remaining.")
            embed.addField(check.name + " can retaliate.", check.name + " has " + check.damage + " attack power.")
            embed.addField(check.name + " is weak to " + check.weakness + " damage.", check.name + " resists " + check.resistance + " damage.")
        } else if (scenarios[object.toUpperCase()]){
            embed.addField(check.check,"Interesting")
        }
    } else if(user[check]){
        embed.addField("You are checking " + user[check].name , "Interesting.")
        embed.addField(user[check].name + " can be attacked.",user[check].name + " has " + user[check].health + " health remaining.")
        embed.addField(user[check].name + " can retaliate.", user[check].name + " is wielding " + user[check].equipped + ", it has " + user[check].equipment[user[check].equipped].damage + " attack power.")
    } else if(user[player].equipment[check]){
        embed.addField("You are checking " + check, "Interesting.")
        embed.addField(check + " has " + user[player].equipment[check].damage + " attack power.", "It does " + user[player].equipment[check].damageType + " damage.")
        embed.addField("This weapon is at level " + user[player].equipment[check].level, "It has " + user[player].equipment[check].heat + " heat and needs " + user[player].equipment[check].maxHeat + " heat for the next level." )
        embed.addField(check + " is a " + user[player].equipment[check].type, user[player].equipment[check].description)
        embed.addField("Moveset", user[player].equipment[check].basic + " " + user[player].equipment[check].support + " " + user[player].equipment[check].charge)
    } else if (items[check]){
        embed.addField("You are checking " + check, "Interesting.")
        //embed.setThumbnail(items[check].art)
        if(items[check].type === "Sword" || items[check].type === "Gun"){
            embed.addField(check + " has " + items[check].damage + " attack power.", "It does " + items[check].damageType + " damage.")       
        }
        embed.addField(check + " is a " + items[check].type,items[check].description)
    }
    PartyAction(embed,player);
}
function SpawnEnemy(room,player){
  var newEnemy = monsters[room.spawn];
  newEnemy.health = ScaleHealth(monsters[room.spawn],player);
  newEnemy.turn = newEnemy.attackSpeed;
  
  user[player].opponent = newEnemy.name;
  party[user[player].party].enemies[user[player].opponent] = newEnemy;
  
}
function SpawnScenario(room,player){
  var newScenario = scenarios[room.effect];
  
  user[player].opponent = newScenario.name;
  party[user[player].party].enemies[user[player].opponent] = newScenario;
  
  
}
function Interact(room,player){
    const interaction = new Discord.RichEmbed();
    if(room === null){
        interaction.setTitle("Nothing to interact with here")
        PartyAction(interaction,player);
        return;
    }
    if(!room.interaction){
        interaction.setTitle("Nothing to interact with here")
        PartyAction(interaction,player);
        return;
    }
    interaction.setTitle(user[player].name + "'s Interaction")
    interaction.addField(room.interaction,"What's going to happen?!.")
    if(room.requirement){
        var test = [];
        for(var i = 0; i < room.requirement; i++){
            if(user[player].items[room.requirement[i]] != null){
                if(user[player].items[room.requirement[i]].amount > 0){
                    test.push("True");
                } else {
                    test.push("False");
                }
            } else {
                test.push("False");  
            }    
        }
        if(test.includes("False")){
            interaction.addField("You don't meet the requirements","TOO BAD")
            PartyAction(interaction,player);
            return;
        }
    }
    if(room.spawn != null){
        if(room.activated != null){
            if(room.activated === true){
                interaction.addField("You have already interacted with this scenario","Press onward.")
                PartyAction(interaction,player);
                return;
            }
        }
        interaction.addField(room.spawn + " has appeared!", "Oh no!")
        SpawnEnemy(room,player);
        if(room.activated != null){
            room.activated = true;
        }
    }
    if(room.effect != null){
        if(room.activated != null){
            if(room.activated === true){
                interaction.addField("You have already interacted with this scenario","Press onward.")
                PartyAction(interaction,player);
                return;
            }
        }
        if(room.effect === "Golden Slime Wheel" && user[player].crowns >= 200){
            user[player].crowns -= 200;
            interaction.addField(user[player].name + "'s Wallet","You have " + user[player].crowns + " crowns left.")
        } else if (room.effect === "Golden Slime Wheel" && user[player].crowns <= 200) {
            interaction.addField("You need more money to spin this wheel.","Rip")  
            PartyAction(interaction,player);
            return;
        }
        var effect = CreateLoot(table[room.effect].loot,table[room.effect].weights);
        if(monsters[effect]){
            SpawnEnemy(room,player);
            interaction.addField(monsters[effect].name + " has suddenly appeared!", "How will we get out of this situation?")
        }
        if(items[effect]){
            AddItem(effect,player);
            interaction.addField(user[player].name + " was rewarded with " + effect, "Congratulations!")
        }
        if(scenarios[effect]){
            SpawnScenario(room,player);
            interaction.addField(user[player].name + " something mysterious has happened...","Interesting...")
        }
        if(room.activated != null){
            room.activated = true;
        }
        
    }
    PartyAction(interaction,player);
}
function EnemyLoot(enemy,player,embed){
    var results = {};
    for(var key in user){
        if(user[key].party === user[player].party && user[key].location === user[player].location && user[key].depth === user[player].depth){
            var rewards = [];
            var drop = CreateLoot(table[enemy.lootTable].loot,table[enemy.lootTable].weights);
            AddItem(drop,key);
            
            var crowns = CreateLoot(crownLoot,crownWeights);
            crowns = Math.floor(crowns * gate.depthscale[user[player].depth]);
            user[key].crowns += crowns;

            var statusRewards = null;
            var rollStatus = AttackChance(20);
            if(
                rollStatus && gate.theme.includes("fire") || 
                rollStatus && gate.theme.includes("freeze") ||
                rollStatus && gate.theme.includes("shock")||
                rollStatus && gate.theme.includes("poison") ){
                    statusRewards = CreateLoot(table[gate.theme[0]].loot,table[gate.theme[0]].weights)
                    rewards.push(statusRewards);
                    AddItem(statusRewards,player);  
            }

            rewards.push(drop);
            rewards.push(crowns +  " Crowns");
            embed.addField(user[key].name + "'s Rewards",rewards)
        }
    }
    results.embed = embed;
    return results;
}
function TakeDamage(source,target,embed){
    var results = {};
    target.health -= source;
    embed.addField(target.name + " has taken "  + source + " damage! ", target.health + " health remaining. ")
    if(target.health <= 0){ 
        embed.addField(target.name + " has fainted ", "...")
    }
    results.embed = embed;
    results.target = target;
    results.source = source;
    return results;
}
function Status(embed,victim,damage){
    var result = {};
    result.canAttack = true;
    if(victim.status != null){
        victim.status.duration -= 1;
        switch(victim.status.name){
            //Damage over time
            case 'fire':
                victim.health -= victim.status.damage;
                embed.addField(victim.name + " is on fire! ",  "Took " + victim.status.damage + " damage from fire! " + victim.health + " health remaining." )
                result.canAttack = true;
            break;
            //Can't move forward
            case 'freeze':
            break;
            //Less Damage can't heal
            case 'poison':
                damage *= victim.status.damage;
                embed.addField(victim.name + " isn't feeling so good! ", victim.name + " is doing less damage.")
                result.canAttack = true;
            break;
            //Randomly doesn't attack
            case 'shock':
                victim.health -= victim.status.damage;
                embed.addField(victim.name + " spasmed out! ", " and took " + victim.status.damage + " damage from shock!")
                embed.addField(victim.health + " health remaining!","Oh boy")
                result.canAttack = false;
            break;
            //Higher chance to miss
            case 'stun':
                victim.turn += victim.status.damage;
                embed.addField(victim.name + " lost a turn!","Oh boy")
            break;
            //Take damage when you attack
            case 'curse':
                victim.health -= victim.damage;
                embed.addField(victim.name + " is cursed! ", " and hurt themselves for " + victim.damage + " damage!")
                embed.addField(victim.health + " health remaining!","Oh boy")
                result.canAttack = true;
            break;
            //Disable all commands
            case 'sleep':
                embed.addField(victim.name + " is really tired... ",  victim.name + " is asleep!")
                result.canAttack = false;
            break;
        }
        if(victim.status.duration <= 0){
            embed.addField(victim.status.name + " has worn off", victim.name + " is no longer affected by it!")
            victim.status = null;
        }
    }
    result.damage = damage;
    result.embed = embed;
    result.health = victim.health;
    result.victim = victim;
    return result;
}
function Trinket(player,damage){
    var trinket = user[player].trinket;
    switch(trinket.type){
        case"Buff":
            damage = Math.round(damage * trinket.damageBoost);
        break;
        case"Charge":
            user[player].cooldown -= trinket.damageBoost;
        break;
        case"Speed":
            //Effect Unsure
        break;
    }
}
function GetMove(weapon, move){
    switch(move){
        case "basic":
            return weapon.basic;
        case "support":
            return weapon.support;
        case "charge":
            return weapon.charge;
    }
}
function Fight(player, move = "basic"){
    Log(user[player].name + " is fighting!")
    //Referencing Enemy and our Weapon
    var embed = new Discord.RichEmbed();
    var enemy = party[user[player].party].enemies[user[player].opponent];
    ////console.log(enemy);
    var weapon = user[player].equipment[user[player].equipped];
    var damage = weapon.damage;
   
    if(weapon.damage <= 0){
        weapon.damage = 1;
    }
    if(user[player].health === null){
        if(user[player].maxHealth === null){
            user[player].maxHealth = 20;
        }
        user[player].health = user[player].maxHealth;
    }
    if(enemy === null){
        embed.setTitle("No enemy here to attack.")
        PartyAction(embed,player);
        return;
    } else if(enemy.health <= 0){
        embed.setTitle("No enemy here to attack.")
        PartyAction(embed,player);
        return;
    }
    if(user[player].downTime){
        embed.setTitle("You are dead, consider restarting the run?")
        PartyAction(embed,player);
        return;
    }
    var canAttack = true;
    var enoughMist = true;
    if(user[player].status != null){
        var playerStatus = Status(embed,user[player],weapon.damage);
        embed = playerStatus.embed;
        user[player] = playerStatus.victim;
        damage = playerStatus.damage;
        canAttack = playerStatus.canAttack;
    }

    enemy.canAttack = true;
    if(enemy.status != null){
        var enemyStatus = Status(embed,enemy,enemy.damage);
        embed = enemyStatus.embed;
        enemy = enemyStatus.victim;
        enemy.health = enemyStatus.health;
        enemy.damage = enemyStatus.damage;
        enemy.canAttack = enemyStatus.canAttack;
    }

    var defense = 0;
    //Player's turn
    //Get your move.
    var myMove = GetMove(weapon,move);
    var dodge = 0;
    if(user[player].mist < moves[myMove].mist){
        enoughMist = false;
    }    
    
    var properties = moves[myMove].properties;
    //console.log(myMove);

    embed.setTitle(user[player].name + " used" + moves[myMove].usage)  
    if(enoughMist){
        //Move Properties.
        //This is how the game tells what each move will do.
        //I can configure properties in the moves.json.
        if(ExamineConditional(properties,"damage")){
            damage = DamageScale(weapon,enemy);
                
            Trinket(player,damage);
            var results = TakeDamage(damage,enemy,embed);
            if(weapon.status){
                if(AttackChance(weapon.chance)){
                    embed.addField(enemy.name + " was inflicted with " + weapon.status + "!","Nice!")
                    enemy.status = status[weapon.status];
                    enemy.status.duration = 3;
                }
            }
            enemy = results.target;
            embed = results.embed;  
        }
        if(ExamineConditional(properties,"multihit")){
            damage = DamageScale(weapon,enemy);
            if(weapon.multihit){
                for(var i = 0; i < weapon.multihit; i++){
                    if(AttackChance(weapon.chance - (i * 2))){
                        damage += DamageScale(weapon,enemy);
                        embed.addField("You hit again!","Whew!")
                    }   
                }
            }              
            Trinket(player,damage);
            var results = TakeDamage(damage,enemy,embed);
            if(weapon.status){
                if(AttackChance(weapon.chance)){
                    embed.addField(enemy.name + " was inflicted with " + weapon.status + "!","Nice!")
                    enemy.status = status[weapon.status];
                    enemy.status.duration = 3;
                }
            }
            enemy = results.target;
            embed = results.embed;  

        }
        if(ExamineConditional(properties,"any status")){
            var possible = ["FIRE","FREEZE","POISON","CURSE","STUN","SHOCK"];
            var rand = Math.floor(Math.random() * possible.length);
            
            enemy.status = {};
            enemy.status = status[possible[rand]];
            enemy.status.duration = 3;

            var results = TakeDamage(damage,enemy,embed);
            enemy = results.target;
            embed = results.embed;   
        }
        if(ExamineConditional(properties,"dodge")){
            dodge = 30;
        }
        if(ExamineConditional(properties, "heal")){
            user[player].health += weapon.damage;
            if(user[player].health >= user[player].maxHealth){
                user[player].health = user[player].maxHealth;
            }
            embed.addField(user[player].name + " has healed for " + weapon.damage + " points!")
        }
        if(ExamineConditional(properties,"cost")){
            user[player].mist -= moves[myMove].mist;
        }
        if(ExamineConditional(properties,"richochet")){

        }
    } else {
        embed.setTitle(user[player].name + " used" + moves[myMove].usage + " ... but it failed!");
    }
    
     
       
    //Enemy's Turn
    embed.addField(enemy.name + " has turns " + ( enemy.turn ) + " turns until it attacks! ","Get Ready...")
    if(enemy.turn <= 0){
        //embed.setThumbnail(enemy.art)
        if(enemy.canAttack){
            if(AttackChance(weapon.range - dodge)){
                var attack = enemy.damage - defense;
                if(attack < 0) { attack = 0;}
                embed.addField(enemy.name + " unleashes an attack!","...")
                var results = TakeDamage(attack,user[player],embed);
                user[player] = results.target;
                embed = results.embed;
            } else {
                embed.addField(enemy.name + " missed! ", "Nice!")
            }
            enemy.turn = enemy.attackSpeed;
        } else {
            embed.addField(enemy.name + " couldn't attack! ","Oh boy")
        }
    }
    if(enemy.health <= 0){
        var rewards = EnemyLoot(enemy,player,embed);
        embed = rewards.embed;
        user[player].equipment[user[player].equipped].heat += (enemy.exp * gate.depthscale[user[player].depth]);
        embed.addField(user[player].name + " your weapon has gained " + enemy.exp + " heat.","Level it up to get stronger!")
        if(user[player].equipment[user[player].equipped].heat > user[player].equipment[user[player].equipped].maxHeat){
            var heat = Heat(player,embed);
            embed = heat.embed;
        }
    } else if (user[player].health <= 0){
        user[player].downTime = true;
        embed.addField("You are now out of commission...","Do !restart to restart the gate.")
    }
    enemy.turn -= 1;
    party[user[player].party].enemies[user[player].opponent] = enemy;
    PartyAction(embed,player);

    //Displaying Stats.
    const stats = new Discord.RichEmbed();
    stats.setTitle(user[player].name + "'s Stats")
    stats.addField("Health",user[player].health)
    stats.addField("Max Health", user[player].maxHealth)
    stats.addField("Weapon",user[player].equipped)
    stats.addField("Mist",user[player].mist)
    stats.addField("Max Mist",user[player].maxMist)
    StatusAction(stats,player);
    
}
function AddItem(item, player, amount = 0){ 
    if(items[item]){
        if(!user[player].items[items[item].name]){
            user[player].items[items[item].name] = {};
            user[player].items[items[item].name].amount = 0;
        }
        user[player].items[items[item].name].name = items[item].name;
        if(user[player].items[items[item].name].amount != null){
            if(amount > 0){
                user[player].items[items[item].name].amount = user[player].items[items[item].name].amount + amount; 
            } else {
                user[player].items[items[item].name].amount = user[player].items[items[item].name].amount + 1; 
            }
        } else {
            if(amount > 0){
                user[player].items[items[item].name].amount = user[player].items[items[item].name].amount + amount; 
            }  else {
                user[player].items[items[item].name].amount = 1;
            }
          
        }       
        Log(user[player].name + " has obtained " + item); 
    } 
}
//Buying Items
function Buy(target,player){
    //Log Items
    Log(user[player].name + " is attempting to buy an item!")
    if(user[player].crowns >= items[target].crowns){
        user[player].crowns -= items[target].crowns;
        AddItem(target,player);
        const embed = new Discord.RichEmbed()
        embed.setTitle(user[player].name + "'s Purchase")
        embed.addField("You've successfully purchased for " + items[target].crowns + " crowns...",target)
        Log(user[player].name + " has purchased " + items[target].name);
        PartyAction(embed,player);
    } else {
        const embed = new Discord.RichEmbed()
        embed.setTitle(user[player].name + "'s Purchase failed")
        embed.addField("You don't have enough money to buy that", "Sorry")
        PartyAction(embed,player);
    }  
}

//Stock Merchants/NPCS
function Stock(enemy){
    for(var i = 0; i < enemy.amount; i++){
        var newItem = CreateLoot(enemy.buyTable,enemy.buyWeights);
        if(!enemy.stock.includes(newItem)){
            ////console.log("Doesn't have this item, add it!");
            enemy.stock.push(newItem);
        }   
    }
    return enemy;
}

//Health Scaling
function ScaleHealth(enemy,player){
    var newHealth = enemy.max;
    if(user[player].depth >= 0 && user[player].depth < 5){
        //console.log("stratum1");
        newHealth = Math.round(newHealth * table.depthscale["1"]);
      } else if (user[player].depth >= 5 && user[player].depth < 8){
        //console.log("stratum2");
        newHealth = Math.round(newHealth * table.depthscale["2"]);
      } else if (user[player].depth >= 8 && user[player].depth < 13){
        //console.log("stratum3");
        newHealth = Math.round(newHealth * table.depthscale["3"]);
      } else if (user[player].depth >= 13 && user[player].depth < 18) {
        //console.log("stratum4");
        newHealth = Math.round(newHealth * table.depthscale["4"]);
      } else if (user[player].depth >= 18 && user[player].depth < 23) {
        //console.log("stratum5");
        newHealth = Math.round(newHealth * table.depthscale["5"]);
      } else if (user[player].depth >= 23 && user[player].depth < 28) {
        //console.log("stratum6");
        newHealth = Math.round(newHealth * table.depthscale["6"]);
      } else if (user[player].depth >= 28 && user[player].depth < 33) {
        //console.log("stratum7");
        newHealth = Math.round(newHealth * table.depthscale["7"]);
      } else if (user[player].depth >= 33 && user[player].depth < 38) {
        //console.log("stratum8");
        newHealth = Math.round(newHealth * table.depthscale["8"]);
      }
    return newHealth;
}
function Forward(player){
    var embed = new Discord.RichEmbed()
    
   // party[user[player].party].dungeon = {};

   //Are you dead? You're not allowed to move forward.
    if(user[player].downTime){
        embed.setTitle("You are dead, consider restarting the run?")
        PartyAction(embed,player);
        return;
    }

    //Get Depth and Location to make this easier to read.
    var depth = user[player].depth;
    var location = user[player].location;

    //Get the enemy
    var enemy = party[user[player].party].enemies[user[player].opponent];

    //Enemy is still here, must kill it first.
    if(enemy != null){
       if(enemy.health > 0 && !enemy.stock){
        embed.addField("You must kill the enemy in this area first, try hitting fight.","Fight fight fight")
        PartyAction(embed,player);
        return;
      }
    }

    //Location
    location += 1;

    //Reached the end of the dungeon
    if(party[user[player].party].dungeon.currentrooms.length <= location){
        //Embed
        const embed = new Discord.RichEmbed()
        //Update location;
        location = party[user[player].party].dungeon.currentrooms.length;
    
        embed.setTitle(user[player].name + " is moving forward! ")
        embed.addField(user[player].name + " has reached the end of this dungeon inside of room " + (user[player].location) + "!", "You'll have to descend to move any further.")
        embed.setFooter(user[player].name)

        //Update the party
        PartyAction(embed,player);
        //Fix up location, don't want the player moving on forever.
        user[player].location = party[user[player].party].dungeon.currentrooms.length - 1;
        return;
    }

    var newMob;
    if(rooms[party[user[player].party].dungeon.currentrooms[location]].monster){
        newMob = rooms[party[user[player].party].dungeon.currentrooms[location]].monster;
    } else {
        newMob = rooms[party[user[player].party].dungeon.currentrooms[location]].scenario;
    }

    var newEnemy;
    if(monsters[newMob]){

        newEnemy = {};

        if(!gate.enemy ) { gate.enemy = 0; }

        newEnemy.id = gate.enemy;
        gate.enemy += 1;
        Log("New Enemy Instanced for " + user[player].name + "'s Party");
        //console.log("Enemy ID " + newEnemy.id);

        newEnemy = monsters[newMob];
        newEnemy.health = ScaleHealth(monsters[newMob],player);
        newEnemy.damage = monsters[newMob].damage;
        newEnemy.turn = newEnemy.attackSpeed;
        newEnemy.canAttack = true;
        newEnemy.status = null;
        newEnemy.status = {};

    } else if (scenarios[newMob]){
        newEnemy = scenarios[newMob];
        if(newEnemy.activated){
            newEnemy.activated = false;
        }
        switch(newEnemy.name){
            case 'Basil':
                newEnemy.stock = Stock(newEnemy).stock;
            break;
            case 'Grasil':
                newEnemy.stock = Stock(newEnemy).stock;
            break;
        }
    }

    user[player].opponent = newEnemy.name.toUpperCase();
    party[user[player].party].enemies[user[player].opponent] = newEnemy;
   
    user[player].depth = depth;
    user[player].location = location;

    //Embed Update
    embed.addField("You have encountered " + newEnemy.name + " inside of room " + user[player].location + "!","Get ready for a fight.")
    //embed.setThumbnail(newEnemy.art)
    //Disabled artwork to improve performance.

    //Update Instance
    PartyAction(embed,player);
    //Log it.
    Log(user[player].name + " is attempting to move forward!")
}
function Descend(player){

    var embed = new Discord.RichEmbed()

    Log(user[player].name +  " is attempting to descend!")

    //Dead
    if(user[player].downTime){
        embed.setTitle("You are dead, consider restarting the run?")
        PartyAction(embed,player);
        return;
    }
    
    //Reached the end of the game.
    if(user[player].depth === maxDepth - 1 && party[user[player].party].currentrooms.length - 1 <= user[player].location){
        embed.setTitle("Congratulations, you have reached the end of this gate, consider restarting the run?")
        PartyAction(embed,player);
        return;
    }


    if(party[user[player].party].dungeon.length - 1 <= user[player].location){
        //Increase Depth reset to room 0.
        user[player].location = 0;
        user[player].depth += 1;

        //Bonus Prize
        var bonusPrize = CreateLoot(table.bonus.loot,table.bonus.weights);
        AddItem(bonusPrize,player);
        
        //Generate new dungeon
        party[user[player].party].dungeon = GenerateDungeon(dungeon.depth[user[player].depth]);

        //Embed
        const embed = new Discord.RichEmbed()
        embed.setTitle(user[player].name + " is descending to depth " + user[player].depth + "...")
        embed.addField(user[player].name + " has reached " + party[user[player].party].dungeon.name + " and is inside of room " + (user[player].location + 1) + " of the dungeon!", "Get ready for an adventure!")
        embed.addField(user[player].name + " has earned a bonus prize of " + bonusPrize , "Congratulations!")
        embed.setFooter(user[player].name)

        //.setThumbnail(dungeon.depth[user[player].depth].art)

        //Update Party Action
        PartyAction(embed,player);
    } else {
        //Embed
        const embed = new Discord.RichEmbed()
        embed.setTitle(user[player].name + " is descending... ")
        embed.addField(user[player].name + " you cannot descend right now, reach the end of the dungeon.")

        //Update Party Action
        PartyAction(embed,player);
    }
}
function Inventory(player){
    Log(user[player].name + " is checking their inventory.");

    //Need a party instance to use inventory.
    if(user[player].partyInstance === 0){
        return;
    }  

    const inv = new Discord.RichEmbed() 
    
        var materials = [];
        var usables = [];
        var weapons = [];
        var recipes = [];
        var minerals = [];
        var trinkets = [];
        var rarity = [];

        //Set the inventory.
        for(var key in user[player].items) {
            if(user[player].items[key].amount > 0){
                if(items[key].type === "Material"){
                    materials.push(user[player].items[key].name + " " + user[player].items[key].amount);
                } else if (items[key].type === "Sword" || items[key].type === "Gun"){
                    weapons.push(user[player].items[key].name + " " + user[player].items[key].amount);
                } else if(items[key].type === "Usable"){
                    usables.push(user[player].items[key].name + " " + user[player].items[key].amount);
                } else if (items[key].type === "Recipe"){
                    recipes.push(user[player].items[key].name + " " + user[player].items[key].amount);
                } else if (items[key].type === "Mineral"){
                    minerals.push(user[player].items[key].name + " " + user[player].items[key].amount);
                } else if (items[key].type === "Trinket"){
                    trinkets.push(user[player].items[key].name + " " + user[player].items[key].amount);
                } else if (items[key].type === "Rarity"){
                    rarity.push(user[player].items[key].name + " " + user[player].items[key].amount);
                }
                ////console.log(user[player].items[key])
            }  
        }
        //If nothing is in this section, push nothing to avoid errors.
        if(materials.length === 0){
            materials.push("Nothing");
        }
        if(usables.length === 0){
            usables.push("Nothing");
        }
        if(weapons.length === 0){
            weapons.push("Nothing");
        }
        if(recipes.length === 0){
            recipes.push("Nothing");
        }
        if(minerals.length === 0){
            minerals.push("Nothing");
        }
        if(trinkets.length === 0){
            trinkets.push("Nothing");
        }
        if(rarity.length === 0){
            rarity.push("Nothing");
        }

        //Sort them out, alphabetically.
        materials.sort();
        usables.sort();
        weapons.sort();
        recipes.sort();
        minerals.sort();
        trinkets.sort();
        rarity.sort();

        inv.setTitle(user[player].name + "'s Inventory")
        inv.addField('Crowns', user[player].crowns)
        //inv.addField('Energy', user[player].energy)
        //Pages to prevent image overflowing.
        switch(user[player].page){
            case 0:
                inv.addField('Page 0 Weapons', weapons)  
                inv.addField('Equipped Weapon', user[player].equipped) 
            break;
            case 1:
                inv.addField('Page 1 Trinkets',trinkets)
                inv.addField('Equipped Trinket', user[player].trinket.name)
            break;
            case 2:
                inv.addField('Page 2 Materials', materials)  
            break;
            case 3:
                inv.addField('Page 3 Minerals', minerals)
            break;
            case 4:
                inv.addField('Page 4 Usables', usables) 
            break;
            case 5:       
                inv.addField('Page 5 Recipes', recipes) 
            break;
            case 6:
                inv.addField('Page 6 Rarities', rarity) 
            break;
        }
        //inv.setThumbnail(user[player].art)
        inv.setColor(0xFCF200)
    
    StatusAction(inv,player); 
}
function UseItem(object,player){
    Log(user[player].name + "is using an item!")
    var effect = items[object].effect;
    const embed = new Discord.RichEmbed()
    embed.setTitle(user[player].name +  " is using an item!")
    embed.addField(items[object].name, user[player].name + " " + items[object].usage)
    //embed.setThumbnail(items[object].art)
    var consumed = false;
    //Different actions here depending on the name and type of said item.
    if(ExamineConditional(effect,"heal")){
        user[player].health += items[object].value;
        consumed = true;
    }
    if(ExamineConditional(effect,"revive")){
        user[player].downTime = false;
        user[player].health += items[object].value;
        consumed = true;
    }
    if(ExamineConditional(effect,"warp")){
        user[player].location = 0;
        user[player].depth = items[object].value;
        consumed = true;  
    }
    if(ExamineConditional(effect,"lootbox")){
        if(user[player].items["Silver Key"]){
            if(user[player].items["Silver Key"].amount > 0){
                var prize = CreateLoot(table[items[object].name].loot,table[items[object].name].weights);
                AddItem(prize,player);
                consumed = true;
                embed.addField("Congratulations, you have unboxed a " + prize, "Enjoy!")
                user[player].items[object].amount -= 1;
                user[player].items["Silver Key"].amount -= 1;
            } else {
                embed.addField("You need a Silver Key to open this","Get Hunting!")
            }
        } else {
            embed.addField("You need a Silver Key to open this","Get Hunting!")
        }
    }
    if(ExamineConditional(effect,"heat")){
        user[player].equipment[user[player].equipped].heat += items[object].value;
        var results = Heat(player,embed);
        embed = results.embed;
        consumed = true;
    }
    if(consumed){
        user[player].items[object].amount -= 1;
    }
    if(user[player].health >= user[player].maxHealth){
        user[player].health = user[player].maxHealth;
    }
    
    //Vials should be thrown at enemies and do status and damage.
    //Barriers should do damage per turn.
    //Health Capsules should heal.
    //Remedies should cure statuses.
    //Recipes should add a recipe to your learned recipes.
    PartyAction(embed,player);
}
function NextPage(player, direction, set = false){
    user[player].page += direction;
    if(set){
        user[player].page = direction;
    }
    
    if(user[player].page > 6){
        user[player].page = 0
    }
    if(user[player].page < 0){
        user[player].page = 6
    }
    
    Inventory(player);
}
function Equip(player,item){
    if(user[player].equipment[item]){
        //If you already have had this weapon before, get its data
        user[player].equipped = items[item].name;

        user[player].equipment[user[player].equipped].basic = items[item].basic;
        user[player].equipment[user[player].equipped].support = items[item].support;
        user[player].equipment[user[player].equipped].charge = items[item].charge;

        user[player].equipment[user[player].equipped].base = items[item].damage;
        user[player].equipment[user[player].equipped].special = items[item].special;
        user[player].equipment[user[player].equipped].damage = items[item].damage * heat[user[player].equipment[item].level];
    } else {
        //If this is your first time with this weapon, create a new instance of it.
        user[player].equipped = items[item].name; 
        user[player].equipment[user[player].equipped] = items[item];
        user[player].equipment[user[player].equipped].heat = 0;
        user[player].equipment[user[player].equipped].maxHeat = 100;
        user[player].equipment[user[player].equipped].level = 1;
        user[player].equipment[user[player].equipped].maxLevel = 10;
        user[player].equipment[user[player].equipped].base = items[item].damage;
        user[player].equipment[user[player].equipped].damage = items[item].damage * heat[user[player].equipment[item].level]; 
        Equip(player,item);
    }
    const embed = new Discord.RichEmbed();
    embed.setTitle("Equipped " + items[item].name);
    PartyAction(embed,player);
    //console.log(user[player].equipment[user[player].equipped]);

}
//The Status Window
function PlayerStatus(instance,player){
    var actions = [gateEmoji,leftpageEmoji,rightpageEmoji];
    const filter = (reaction, user) => actions.includes(reaction.emoji.id) && user.id === player
    const collector = instance.createReactionCollector(filter, { max: 10000000, time: 2147483647 });
                collector.on('collect', r => {
                    //If maintenance mode is turned on, don't let users interact.
                if(admin.maintenance && !user[player].admin)   {
                    //console.log(user[player].name + " is not an Admin.")
                     return;
                }
                switch(r.emoji.name){
                    case 'gate':
                        CheckGate(player);
                    break;    
                    case 'leftpage':
                        NextPage(player,-1);
                    break;
                    case 'rightpage':
                        NextPage(player,1);
                    break;    
                }             
        }); 
        //Restart the reaction collector if it ends.
        collector.on('end',r =>{
            Log(user[player].name + "'s collector ended, booting up a new one.")
            PlayerStatus(instance,player);
        });
}
//Player Instance
function PlayerCommands(instance,player){
    var actions = [forwardEmoji,fightEmoji,descendEmoji,checkEmoji,interactEmoji,supportEmoji,chargeEmoji];
    const filter = (reaction, user) => actions.includes(reaction.emoji.id) && user.id === player
    const collector = instance.createReactionCollector(filter, { max: 10000000, time: 2147483647 });
                collector.on('collect', r => {
                    //If maintenance mode is turned on, don't let users interact.
                if(admin.maintenance && !user[player].admin)   {
                    //console.log(user[player].name + " is not an Admin.")
                     return;
                }
                switch(r.emoji.name){
                    case 'basic':
                        Fight(player,"basic");
                    break;
                    case 'support':
                        Fight(player,"support");
                    break;
                    case 'charge':
                        Fight(player,"charge");
                    break;         
                    case 'forward':
                        Forward(player);
                    break;
                    case 'descend':
                        Descend(player);
                    break;
                    case 'interact':
                        Interact(party[user[player].party].enemies[user[player].opponent],player);
                    break;
                    case 'check':
                        Check(user[player].opponent,player);
                    break;
                    case 'special':
                        if(user[player].cooldown <= 0){
                            Fight(player,true,true);
                        } else {
                            const embed = new Discord.RichEmbed()
                            embed.setTitle("You need more battle commands to use your special attack! " + user[player].cooldown + " more commands needed!")
                            PartyAction(embed,player);
                        }
                    break;
                    case 'block':
                        Fight(player,false);
                    break;
                   
                }  
                    
        }); 
        //Restart the reaction collector if it ends.
        collector.on('end',r =>{
            Log(user[player].name + "'s collector ended, booting up a new one.")
            PlayerCommands(instance,player);
        });
}
//Restart said Instance
function RebootInstance(player){
  
    //If the player had a party instance and a channel after a reboot.
    //Reactivate the reaction collectors.
    if(!user[player].partyChannel || !user[player].party){
      return;
    }
  
    var thechannel = bot.channels.get(user[player].partyChannel); 
    var thestatschannel = bot.channels.get(user[player].statsChannel);

    if(admin[player]){
      try {
        var theadminchannel = bot.channels.get(admin[player].boardChannel);
        theadminchannel.fetchMessage(admin[player].board).then ( instance =>{      
          //console.log("Rebooting Board");
          AdminDashboard(instance,player);                
        });  
      } catch(e){
        console.log("Admin Reboot Failed, probably doesn't exist.");
      }
    }
  
    if(user[player].party != 0){
      thechannel.fetchMessage(user[player].party).then ( instance =>{      
      //console.log("Rebooting Instance");
      PlayerCommands(instance,player);                
    }); 
      
    if(user[player].stats != null){
        thestatschannel.fetchMessage(user[player].stats).then ( instance =>{      
        //console.log("Rebooting Stats");
        PlayerStatus(instance,player);                
        });  
    } 
    
  }
}
//Apply Changes to Status Window
function StatusAction(action, player){
    var channel = bot.channels.get(user[player].statsChannel); 
    if(user[player].stats != 0){
        channel.fetchMessage(user[player].stats).then (sentEmbed =>{         
                 sentEmbed.edit(action);                
    });           
} else {
    channel.send("Please type in the channel that your party instance is in.");
}}
//Apply Changes to Instance Window
function PartyAction(action, player){
    var channel = bot.channels.get(user[player].partyChannel); 
    if(user[player].party != 0){
        channel.fetchMessage(user[player].party).then (sentEmbed =>{         
                 sentEmbed.edit(action);                
    });           
} else {
    channel.send("Please type in the channel that your party instance is in.");
}
}
//Log
function Log(action){
    var currentdate = new Date(); 
    var datetime = currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/" 
                + currentdate.getFullYear() + " @ "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes() + ":" 
                + currentdate.getSeconds();
    var log = bot.channels.get("592519951060041738");
    log.send(datetime + ": " + action);
}
//Create Stats Window
function CreateStats(instance,player){
    user[player].stats = instance.id;
    user[player].statsChannel = instance.channel.id;
    Log(user[player].name + " has created new stats");
}
//Create Instance Window
function CreateParty(instance,player){
    user[player].party = instance.id; //ID of the channel.
    user[player].partyChannel = instance.channel.id; //Channel the instance is in
    user[player].opponent = "Nothing"; //What are we facing?
    //console.log(user[player].party);
    party[instance.id] = {};
    party[instance.id].enemies = {};
    
    //console.log("New Instance")
    Log(user[player].name + " has created a new instance");
}
//Create Admin Dashboard Window
function CreateAdmin(instance,player){
    admin[player] = {};
    admin[player].board = instance.id;
    admin[player].boardChannel = instance.channel.id;
    admin[player].job = "Grant";
    admin[player].page = "Weapon";
    admin[player].index = 0;
    admin[player].choice = "Calibur";
    admin[player].choiceAmount = 1;
    Log(user[player].name + " has created a dashboard.");
}
//Admin Dashboard Commands/Reactions
function AdminDashboard(instance,player){
    var actions = [confirmEmoji,removeEmoji,nextEmoji,previousEmoji,increaseEmoji,decreaseEmoji];
    const filter = (reaction, user) => actions.includes(reaction.emoji.id) && user.id === player
    const collector = instance.createReactionCollector(filter, { max: 10000000, time: 2147483647 });
                collector.on('collect', r => {
                    //If maintenance mode is turned on, don't let users interact.
                if(!user[player].admin)   {
                    //console.log(user[player].name + " is not an Admin.")
                    return;
                }
                switch(r.emoji.name){  
                    case "confirm":
                        AddItem(admin[player].choice,player,admin[player].choiceAmount);
                        var embed = new Discord.RichEmbed();
                        embed.setTitle("Item Granted");
                        AdminAction(embed,player);
                    break;
                    case "remove":
                        AddItem(admin[player].choice,player,-admin[player].choiceAmount);
                        var embed = new Discord.RichEmbed();
                        embed.setTitle("Items Removed");
                        AdminAction(embed,player);
                    break;
                    case "next":
                        FindItem(player,1);
                    break;
                    case "previous":
                        FindItem(player,-1);
                    break;
                    case "increase":
                        admin[player].choiceAmount += 1;
                        FindItem(player,0);
                     
                    break;
                    case "decrease":
                        admin[player].choiceAmount -= 1;
                        FindItem(player,0);       
                    break;
                }             
        }); 
        //Restart the reaction collector if it ends.
        collector.on('end',r =>{
            Log(user[player].name + "'s collector ended, booting up a new one.")
            AdminDashboard(instance,player);
        });
}
function FindItem(player,index = 0, item = null){
    var embed = new Discord.RichEmbed();
    admin[player].index += index;
    embed.setTitle("Item Viewer");
    embed.addField("Tutorial", "Use the up and down arrows to increase/decrease the amount you want to give.  Use confirm to add items, remove to remove items.")
    embed.addField("Count",admin[player].choiceAmount);

    var materialList = [];
    var weaponList = [];
    var trinketList = [];
    var usableList = [];
    var rarityList = [];
    var recipeList = [];
 
    
    //Sorting
    for(var key in items){
        switch(items[key].type){
            case "Material":
                materialList.push(key);
            break;
            case "Sword":
                weaponList.push(key);
            break;
            case "Gun":
                weaponList.push(key);
            break;
            case "Usable":
                usableList.push(key);
            break;
            case "Trinket":
                trinketList.push(key);
            break;
            case "Rarity":
                rarityList.push(key);
            break;
            case "Recipe":
                recipeList.push(key);
            break;
        }
    }

    //Pages
    switch(admin[player].page){
        case "Material":
            if(admin[player].index >= materialList.length){
                admin[player].index = 0; 
            }
            
            var myItem = items[materialList[admin[player].index]];
            if(item != null) { myItem = item; }

            admin[player].choice = materialList[admin[player].index];
            embed.addField("Name",myItem.name);
            embed.addField("Type",myItem.type);
            embed.addField("Description",myItem.description);
            embed.setThumbnail(myItem.art);
        break;
        case "Weapon":
            if(admin[player].index >= weaponList.length){
                admin[player].index = 0; 
            }
            var myItem = items[weaponList[admin[player].index]];
            if(item != null) { myItem = item; }

            admin[player].choice = weaponList[admin[player].index];
            embed.addField("Name",myItem.name);
            embed.addField("Damage",myItem.damage);
            embed.addField("DamageType",myItem.damageType);
            embed.addField("Basic Move",myItem.basic);
            embed.addField("Support Move", myItem.support);
            embed.addField("Charge Move", myItem.charge);
            embed.addField("Hit Rate", myItem.range + "%");
            embed.addField("Buy Price", myItem.crowns);
            embed.addField("Type",myItem.type);
            embed.addField("Description",myItem.description);
            embed.setThumbnail(myItem.art);
        break
        case "Usable":
            if(admin[player].index >= usableList.length){
                admin[player].index = 0; 
            }
            var myItem = items[usableList[admin[player].index]];
            if(item != null) { myItem = item; }

            admin[player].choice = usableList[admin[player].index];
            embed.addField("Name",myItem.name);
            embed.addField("Usage", myItem.usage);
            embed.addField("Effect",myItem.effect);
            if(myItem.value){
                embed.addField("Value",myItem.value)
            }       
            embed.addField("Type",myItem.type);
            embed.addField("Description",myItem.description);
            embed.setThumbnail(myItem.art);
        break;
        case "Trinket":
            if(admin[player].index >= trinketList.length){
                admin[player].index = 0; 
            }
            var myItem = items[trinketList[admin[player].index]];
            if(item != null) { myItem = item; }

            admin[player].choice = trinketList[admin[player].index];
            embed.addField("Name",myItem.name);
            embed.addField("Type",myItem.type);
            embed.addField("Damage Boost", myItem.damageBoost);
            embed.addField("Damage Type", myItem.damageType);
            embed.addField("Health Boost", myItem.healthBoost);
            embed.addField("Family Boost", myItem.familyBoost);
            embed.addField("Weapon Boost",myItem.weaponBoost);
            enbed.addField("Defense Boost", myItem.defenseBoost);
            embed.addField("Description",myItem.description);
            embed.setThumbnail(myItem.art);
        break;
        case "Rarity":
            if(admin[player].index >= rarityList.length){
                admin[player].index = 0; 
            }
            var myItem = items[rarityList[admin[player].index]]; 
            if(item != null) { myItem = item; }

            admin[player].choice = rarityList[admin[player].index];
            embed.addField("Name",myItem.name);
            embed.addField("Type",myItem.type);
            embed.addField("Description",myItem.description);
            embed.setThumbnail(myItem.art);   
        break;
        case "Recipe":
            if(admin[player].index >= recipeList.length){
                admin[player].index = 0; 
            }
            var myItem = items[recipeList[admin[player].index]];
            if(item != null) { myItem = item; }

            admin[player].choice = recipeList[admin[player].index];
            embed.addField("Name",myItem.name);
            embed.addField("Type",myItem.type);
            embed.addField("Description",myItem.description);
            embed.setThumbnail(myItem.art);  
        break;
    }
    AdminAction(embed,player);
}
//Admin Actions
function AdminAction(action,player){
    var channel = bot.channels.get(admin[player].boardChannel); 
    if(admin[player].board != 0){
        channel.fetchMessage(admin[player].board).then (sentEmbed =>{         
                 sentEmbed.edit(action);                
    });           
    } else {
        channel.send("Please type in the channel that your party instance is in.");
    }
}

bot.on('messageUpdate', message =>{
   // user[message.author.id].channel = message.channel.id;
    SaveData();
})
bot.on('message', message=> {
    if(message.channel.type === "dm"){
        return;
    } 
    let player = message.author.id;
    if(!user[player]) {
        Log(message.author.username + " a new player has joined the game! New data created for them.");
        user[player] = {};
        user[player].name  = message.author.username;
        user[player].health  = 20;
        user[player].maxHealth = 20;
        user[player].rank = "Recruit";
        user[player].experience = 0;
        user[player].crowns = 0;   
        user[player].items = {"Calibur":{"name":"Calibur","amount":1}}; 
        user[player].page = 0;
        user[player].mist = 100;
        user[player].maxMist = 100;
        user[player].art = message.author.avatarURL;
        user[player].equipped = "Calibur";
        user[player].equipment = {};
        user[player].equipment["Calibur"] = items["Calibur"];
        user[player].equipment["Calibur"].level = 1;
        user[player].equipment["Calibur"].maxLevel = 10;
        user[player].equipment["Calibur"].heat = 0;
        user[player].equipment["Calibur"].maxHeat = 100;
        user[player].downTime = false;
        user[player].location = 0;
        user[player].depth = 0;
        user[player].party = 0;
        user[player].opponent = "Nothing";
        user[player].partyChannel = null;  
        user[player].trinket = {};
        user[player].cooldown = 0;   
    } 
    if(message.author.username != user[player].name){
        user[player].name  = message.author.username;
    }
    if(!user[player].opponent) { user[player].opponent = "Nothing"; }
    if(!user[player].party) { user[player].party = 0;}
    var myRole;
    let args = message.content.substring(prefix.length).split(" ");

    //Text
    if(message.channel.type === "text"){
        myRole = message.guild.roles.find(role => role.name === "Bot Admin").id;
        admin.role = myRole;
    }

    user[player].admin = message.member.roles.has(myRole);
 
    //If maintenance mode is enabled don't let players interact.
    if(admin.maintenance && !user[player].admin){
        //console.log(message.author.username + " is not an Admin.")
        return;
    }
    switch(args[0]){
        case 'user':
            if(!message.member.roles.has(myRole)){
                message.reply("Admin Command.")
                message.delete();s
                return;        
            }
            var players = [];
            for (var key in user){
                players.push(user[key].name + " ");
            }
            message.reply("Current Playerbase: " + players);
        break;
        case 'find':     
            if(!message.member.roles.has(myRole)){
                message.reply("Admin Command.")
                message.delete();
                return;        
            }
            if(!admin[player]){
                message.reply("Please open a dashboard.");
                return;
            }
            var search = "";
            for (var i = 1; i < args.length; i++) {
                search += args[i].toString();
                if (args[i + 1] != null) {
                    search += " ";
                }
            }
            if(items[search]){
                admin[player].page = items[search].type;
                if(admin[player].page === "Sword") { admin[player].page = "Weapon"; }
                if(admin[player].page === "Gun") { admin[player].page = "Weapon"; }
                admin[player].choice = items[search].name;
                FindItem(player,admin[player].index,items[search]);
            } else {
                message.reply("Invalid Item: " + search);
            }
            message.delete();
        break;
        case 'page':
            if(!admin[player]){
                message.reply("Please open a dashboard.");
                return;
            }
                if(message.member.roles.has(myRole)){
                    admin[player].page = args[1];          
                } else {
                    message.reply("Admin Command.")
                }
                message.delete();
        break;
        //#region maintenance (Admin Command)
        case 'maintenance':
            if(message.member.roles.has(myRole)){
                if(!admin.maintenance){
                    admin.maintenance = true;
                } else {
                    admin.maintenance = !admin.maintenance;
                }
                message.reply("Maintenance Mode set to " + admin.maintenance);
                message.delete();
            } else {
                message.reply("Admin Command.")
            }
        break;
        //#endregion
        //#region deposit
        case 'deposit':
            if(!args[1] || !args[2]){
                message.author.send("Invalid Arguments");
                return;
            }
            var mineral = "";
            for (var i = 1; i < args.length; i++) {
                if(args[i + 1] != args[args.length]){
                    mineral += args[i].toString();
                }
               
                if (args[i + 1] != null && args[i + 1] != args[args.length - 1]) {
                    mineral += " ";
                }
            }
            var amount = parseInt(args[args.length - 1].toString());
            ////console.log(mineral.toUpperCase())
            if(gate.minerals[mineral.toUpperCase()] != null){
                if(user[player].items[mineral]){
                    if(user[player].items[mineral].amount >= amount){
                        gate.minerals[mineral.toUpperCase()] += amount;
                        user[player].items[mineral].amount -= amount;
                        message.author.send("Deposited " + amount + " " + mineral)
                    } else {
                            message.author.send("You don't have enough of said mineral."); 
                    }
                } else {
                        message.author.send("You don't have said mineral.");
                }
            } else {
                    message.author.send("Mineral doesn't exist, check your spelling.");
            }
            
            message.delete();
        break;  
        //#endregion
        //#region Player Inventory
        case 'inventory':
            if(user[player].party === 0){
                message.author.send("You need to create a party instance first. do !create");
                 return;
            }
            if(!args[1]){
                message.author.send("Specify Page Number")
                message.delete();
                return;
            }
            if(user[player].downTime > 0){
                ////console.log("You can't do anything!");
                return;
            }
            if(user[player].partyInstance === 0){
                message.author.send("You need to create a party instance first. do !create");
          
                return;
            }  
            NextPage(player,parseInt(args[1]),true);     
            message.delete();
        break;
         //#endregion
        //#region buy
         case 'buy':
                if(user[player].party === 0){
                    message.author.send("You need to create a party instance first. do !create");
                    return;
                }
                if(user[player].downTime > 0){
                    ////console.log("You can't do anything!");
                    return;
                }
                if(!args[1]){
                    message.author.send("Specify Item");
                    message.delete();
                    return;
                }
                var purchase = "";
                for(var i = 1; i < args.length; i++){
                    purchase += args[i].toString();
                    if(args[i + 1]){
                        purchase += " ";
                    }
                }
                ////console.log(purchase + " I want to buy this ");
                if(party[user[player].party].enemies[user[player].opponent].name === "Basil" || party[user[player].party].enemies[user[player].opponent].name === "Grasil"){
                    ////console.log("Basil is here")
                    if(party[user[player].party].enemies[user[player].opponent].stock.includes(purchase)){
                        Buy(purchase,player);
                    } else {
                        message.author.send("Basil isn't here or that item isn't available");
                    }
                }   
                message.delete();
            break; 
            //#endregion
        //#region restart
            case 'restart':
            if(user[player].party === 0){
                message.author.send("You need to create a party instance first. do !create");
                return;
            }
            var restart = new Discord.RichEmbed()
            restart.setTitle("Starting from the begining!")
            user[player].location = 0;
            user[player].depth = 0;
            user[player].downTime = false;
            user[player].health = user[player].maxHealth;
            party[user[player].party].enemies[user[player].opponent].health = 0;
            PartyAction(restart,player);
        break; 
        //#endregion
        //#region auction
        /*
        case 'auction':
            if(!args[5]){
                message.author.send("Invalid Arguments");
                message.delete();
                return;
            }
            var myItem = "";
            var numbers = 0;
            for (var i = 1; i < args.length; i++) {
                if(items[myItem] != null){
                    numbers = i;
                    ////console.log(args[i]);
                    break;
                } else {
                    ////console.log(myItem + " Item doesn't exist");
                    myItem += args[i].toString();
                    if(!items[myItem]){
                        myItem += " ";
                    }       
                }       
            }
            ////console.log(myItem);
            if(user[player].items[myItem] != null){
                if(user[player].items[myItem].amount >= parseInt(args[numbers])){
                    var amount = parseInt(args[numbers]);
                    var bid = parseInt(args[numbers + 1]);
                    var price = parseInt(args[numbers + 2]);
                    var time = parseInt(args[numbers + 3]);
                    if(time != 0 && time != null){
                       // NewAuction(myItem,amount,bid,price,time,player);
                        user[player].items[myItem].amount -= amount;
                    } else {
                        message.author.send("Please specify time, in seconds.");
                        message.delete();
                        return;
                    }    
                }   
            } else {
                message.author.send("You don't have this item");
            }
            message.delete();
        break;  */
        //#endregion 
        //#region Equips an item
        case 'equip':
            if(user[player].party === 0){
                message.author.send("You need to create a party instance first. do !create");
                return;
            }
            if(!args[1]){
                message.author.send("Invalid Arguments");
                return;
            }   
            var item = "";
            for (var i = 1; i < args.length; i++) {
                item += args[i].toString();
                if (args[i + 1] != null) {
                    item += " ";
                }        }
          
            if(user[player].items[item]){ 
                if(items[item].type === "Sword" || items[item].type === "Gun"){
                   // if(!user[player].equipment) {user[player].equipment = {};}
                   if(user[player].items[item]){
                       if(user[player].items[item].amount > 0){
                           
                       } else {
                           message.author.send("You don't have " + item);
                           return;
                       }
                   } else {
                       message.author.send("You don't have " + item);
                       return;
                   }
                    Equip(player,item);

                    Log(user[player].name + " has equipped " + items[item].name);
                } else if (items[item].type === "Trinket"){

                    user[player].trinket = items[item];
                    const trink = new Discord.RichEmbed();
                    trink.setTitle("Equipped " + item);
                    PartyAction(trink,player);
                    
                    if(items[item].damageType === "Health"){
                        user[player].maxHealth = Math.floor(20 * items[item].healthBoost);
                    }

                    Log(user[player].name + " has equipped " + items[item].name);
                } else {
                    message.author.send("This is not a weapon or trinket.")
                }             
            } else {
                message.author.send("Item does not exist");
            }
            message.delete();
        break;
        //#endregion
        //#region Crafting
        case 'craft':
            if(user[player].party === 0){
                message.author.send("You need to create a party instance first. do !create");
                return;
            }
            if(user[player].downTime > 0){
                ////console.log("You can't do anything!");
                return;
            }
            if(!args[1]){
                message.author.send("Specify Item");
            }
            var choice = "";
            for(var i = 1; i < args.length; i++){
                choice += args[i].toString();
                if(args[i + 1]){
                    choice += " ";
                }
            }
            const craft = new Discord.RichEmbed()
            craft.setTitle("Attempting to craft " + choice)
            if(items[choice]){
                
                var myItems = user[player].items;
              
                    if(!myItems[choice + " Recipe"]){
                        ////console.log("Can't craft this, don't have the recipe.");
                        craft.addField("Failure", "You don't have this recipe.")
                        message.delete();
                        PartyAction(craft,player);
                        return;
                    }
                    var attemptcraft = [];
                    var missing = [];
                    for(var i = 0; i < items[choice + " Recipe"].needed.length; i++){
                        var requirement = items[choice + " Recipe"].needed[i];
                        ////console.log(requirement);
                        if(myItems[requirement]){
                            if(myItems[requirement].amount >= items[choice + " Recipe"].amounts[i]){
                                attemptcraft.push("True");
                            } else {
                                attemptcraft.push("False");
                                missing.push(items[choice + " Recipe"].amounts[i] - myItems[requirement].amount + " " + requirement);
                            }
                        } else {
                            attemptcraft.push("False");
                            missing.push(items[choice + " Recipe"].amounts[i] + " " + requirement);
                        }  
                    }
                    if(attemptcraft.includes("False")){
                        craft.addField("Failure", "You are missing some materials: " + missing)
                        ////console.log("Missing Materials!");
                    } else {
                        ////console.log("Crafting Success!");
                        for(var i = 0; i < items[choice + " Recipe"].needed.length; i++){
                            var requirement = items[choice + " Recipe"].needed[i];
                            user[player].items[requirement].amount -= items[choice + " Recipe"].amounts[i];
                            ////console.log("Removing Materials...");
                        }
                        craft.addField("Success!", "Enjoy your new " + choice)
                        AddItem(choice,player);
                    }
                
            } else {
                ////console.log("Can't craft this, don't have the recipe.");
                craft.addField("Failure", "this item doesn't exist") 
            }
            message.delete();
            PartyAction(craft,player);
        break;
        //#endregion
        //#region Usables
        case'use':
            if(user[player].partyChannel != message.channel.id){
                message.author.send("Don't do commands in other channels!");
                return;
            }
            if(!args[1]){
                message.author.send("Please specify item");
                return;
            }
            var object = "";
            for(var i = 1; i < args.length; i++){
                    object += args[i].toString();
                if(args[i + 1]){
                    object += " ";
                }
            }
            ////console.log(user[player].name + " is attempting to use " + object + "!");
            if(items[object] != null){
                if(user[player].items[object] != null){
                    if(items[object].type === "Usable"){
                        if(user[player].items[object].amount > 0){
                            UseItem(object,player);
                        } else {
                            message.author.send("This item is not in your inventory.");
                        }
                    } else {
                        message.author.send("This item is not a usable");
                    }    
                } else {
                    message.author.send("This item is not in your inventory.");
                }    
            } else {
                message.author.send("This item doesn't exist, or you spelled it wrong, capitals count.");
            }
            message.delete();
        break;
        //#endregion
        //#region Grant Item (Admin Command)
        case 'grant':
            if(message.member.roles.has(myRole)){
                if(!args[1]){
                    message.author.send("Invalid Arguments.");
                    return;
                }
                var wish = "";
                var start = 0;
                for(var i = 1; i < args.length; i++){
                    wish += args[i].toString();
                    if(args[i] === "Crowns"){
                        start = i;
                        break;
                    }
                    if(items[wish]){
                        start = i;
                        break;
                    }
                       
                    if(args[i + 1]){
                        wish += " ";
                    }
                }
                var target = "";
                var amount = parseInt(args[args.length - 1]);
                
                for(var i = start + 1; i < args.length; i++){
                    target += args[i].toString();
                    for(var key in user){
                        if(user[key].name === target){
                            if(wish === "Crowns"){
                                user[key].crowns += amount;
                                message.author.send("Wish Granted.");
                                return;
                            }
                            if(items[wish]){
                               
                                AddItem(wish,key,amount);   
                                message.author.send("Wish Granted.");
                            } else {
                                message.author.send("Invalid Item.");
                            }
                        }
                    }
                    if(args[i + 1]){
                        target += " ";
                    }
                }
                //console.log(wish);
                //console.log(target);
                //console.log(amount);
            } else {
                message.author.send("You do not have the neccessary roles.");
            }  
            message.delete();
        break;
        //#endregion
       
        case 'dashboard':{
            if(!message.member.roles.has(myRole)){
                message.reply("Admin Command.")
                return;
            }
            var server = message.channel;
            const embed = new Discord.RichEmbed();
            embed.setTitle(user[player].name + "'s Admin Dashboard")
            server.send(embed).then  (async function (sentEmbed) {
                await sentEmbed.react(confirmEmoji);
            await sentEmbed.react(removeEmoji);
                await sentEmbed.react(increaseEmoji);
                await sentEmbed.react(decreaseEmoji);
                await sentEmbed.react(previousEmoji);
                await sentEmbed.react(nextEmoji);
             
                sentEmbed.edit("Ready to go!");
                CreateAdmin(sentEmbed,player);
                AdminDashboard(sentEmbed,player);            
            });  
            message.delete();
        }
        break;

        case 'count':
            if(!admin[player]){
                message.reply("Please open a dashboard.");
                return;
            }
            if(!message.member.roles.has(myRole)){
                message.reply("Admin Command.")
                message.delete();
                return;        
            }
            try {
                admin[player].choiceAmount = parseInt(args[1]);
                FindItem(player,0);
            } catch {
                message.reply("Not a number");
            }
            message.delete();
        break;
        //#region Create Party
        case 'create':{
            if(user[player].downTime > 0){
                ////console.log("You can't do anything!");
                return;
            }
            //The Party Instance id is automatically set to 0 from the start.
            const embed = new Discord.RichEmbed();
            const stats = new Discord.RichEmbed();
            //Can create private parties, which creates an entire channel for you.
            if(args[1] === "private"){
                message.author.send("The term private is not used anymore.  Simply do .create");
                
            } else {   
                var server = message.guild;
                var name = message.author.username;
                let playerRole = message.guild.roles.find(x => x.name === name);
                let playerChannel = message.guild.channels.get(user[player].partyChannel);
                let playerStatsChannel = message.guild.channels.get(user[player].statsChannel);

                if(playerRole != null){
                    playerChannel.delete();
                    if(playerStatsChannel != null){
                        playerStatsChannel.delete();
                    }  
                    playerRole.delete();
                    message.author.send("Deleting old party...")
                }
                let everyone = message.guild.roles.find(x => x.name === "@everyone");
                let botAdmin = message.guild.roles.find(x => x.name === "Bot Admin");
                message.guild.createRole({
                    name: message.author.username,
                }).then (newRole =>{
                    server.createChannel(name + "s Party", "text").then (myServer =>{
                    myServer.overwritePermissions(everyone,{
                        VIEW_CHANNEL: true,
                        SEND_MESSAGES: false,
                        READ_MESSAGE_HISTORY: true,
                    })
                    myServer.overwritePermissions(newRole,{
                        VIEW_CHANNEL: true,
                        SEND_MESSAGES: true,
                        READ_MESSAGE_HISTORY: true,
                    })
                    myServer.overwritePermissions(botAdmin,{
                        VIEW_CHANNEL: true,
                        SEND_MESSAGES: true,
                        READ_MESSAGE_HISTORY: true,
                    })
                   
                    message.member.addRole(newRole);
                    embed.setTitle(user[player].name + "'s instance")
                        myServer.send(embed).then  (async function (sentEmbed) {
                            await sentEmbed.react(fightEmoji);
                            await sentEmbed.react(supportEmoji);
                            await sentEmbed.react(chargeEmoji);
                            await sentEmbed.react(forwardEmoji);
                            await sentEmbed.react(checkEmoji);
                            await sentEmbed.react(interactEmoji);
                            await sentEmbed.react(descendEmoji);
                         
                            sentEmbed.edit("Ready to go!");
                            CreateParty(sentEmbed,player);
                            PlayerCommands(sentEmbed,player);
                            
                        });  
                        
                }) 
                    server.createChannel(name +"s Stats", "text").then (myServer =>{
                        myServer.overwritePermissions(everyone,{
                            VIEW_CHANNEL: false,
                            SEND_MESSAGES: false,
                            READ_MESSAGE_HISTORY: false,
                        })
                        myServer.overwritePermissions(newRole,{
                            VIEW_CHANNEL: true,
                            SEND_MESSAGES: true,
                            READ_MESSAGE_HISTORY: true,
                        })
                        myServer.overwritePermissions(botAdmin,{
                            VIEW_CHANNEL: true,
                            SEND_MESSAGES: true,
                            READ_MESSAGE_HISTORY: true,
                        })

                        stats.setTitle(user[player].name + "s Stats")
                        myServer.send(stats).then (async function (sentEmbed){
          
                            await sentEmbed.react(leftpageEmoji);
                            await sentEmbed.react(rightpageEmoji);
                            await sentEmbed.react(gateEmoji);
                            CreateStats(sentEmbed,player);
                            PlayerStatus(sentEmbed,player);
                        });  
                    })
                });
            }
               
        }
        message.delete();
        break;
        //#endregion
        //#region Image Resources (Admin Command)
        case 'rsrc':
            if(message.member.roles.has(myRole)){
                message.author.send(resources);
            } else {
                message.author.send("You do not have the neccessary roles.");
            }  
            message.delete();
        break;
        //#endregion
        //#region Force Gate Rotation(Admin Command)
        case 'force':
            if(message.member.roles.has(myRole)){
                gate.lifeTime = 999999999;
                message.author.send("Gate Forced");
            } else {
                message.author.send("You do not have the neccessary roles.");
            }     
            message.delete();
        break;
        //#endregion
        //#region Check Item/Player/Enemy/Scenario/Room
        case 'check':
            if (user[player].partyChannel != message.channel.id) {
                message.author.send("Don't do commands in other channels!");
                return;
            }
            if (!args[1]) {
                message.author.send("Please specify something to check.");
                return;
            }
            var object = "";
            for (var i = 1; i < args.length; i++) {
                object += args[i].toString();
                if (args[i + 1] != null) {
                    object += " ";
                }
            }
            ////console.log("Attempting to check in the room: " + object + "!");
            Check(object, player);   
            message.delete();
        break;
        //#endregion
        //#region Peek into another player's inventory (Admin Command)
        case 'peek':
            if(!args[1]){
                message.author.send("Please specify something to peek.");
                return;
            }
            for(var key in user){
                if(user[key].name === args[1]){
                    //console.log(user[key].items);
                }
            }
            message.delete();
        break;
        //#endregion       
    }
    
    //All Data we need to keep track of
    SaveData();
})

bot.login(process.env.TOKEN);
