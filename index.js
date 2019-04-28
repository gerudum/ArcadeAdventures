const Discord = require('discord.js');
const bot = new Discord.Client();
require('http').createServer().listen(3000)


var
  CircularJSON = require('circular-json'),
  obj = { foo: 'bar' },
  str
;

const fs = require('fs');

let userData = JSON.parse(fs.readFileSync('Storage/userData.json','utf8')); // Player Stats
let monsters = JSON.parse(fs.readFileSync('Storage/monsters.json','utf8')); //Read Only
let enemies = JSON.parse(fs.readFileSync('Storage/enemyInstance.json','utf8')); //Active Enemies
let dungeons = JSON.parse(fs.readFileSync('Storage/dungeons.json',"utf8")); //Read Only
let dungeon = JSON.parse(fs.readFileSync('Storage/dungeonInstance.json',"utf8")); //Active Dungeon
let scenarios = JSON.parse(fs.readFileSync('Storage/scenarios.json',"utf8")); //Read Only
let items = JSON.parse(fs.readFileSync('Storage/items.json',"utf8")); //Read Only
let rooms = JSON.parse(fs.readFileSync('Storage/rooms.json',"utf8")); //Read Only
let gate = JSON.parse(fs.readFileSync('Storage/gate.json',"utf8")); //Checking if it's time for a new gate.
let status = JSON.parse(fs.readFileSync('Storage/status.json',"utf8")); //Statuses!
let auctions = JSON.parse(fs.readFileSync('Storage/auctions.json',"utf8")); //Checking if it's time for a new gate.

const prefix = "!";
var commands = ["PREFIX = !", "info version", "fight {enemyname}", "forward","check {object}","inventory", "inventory stats", ];
var downTime = 10;
const resources = "https://imgur.com/a/htUgqoA";
var version = "Beta 1.0.0";
var maxDepth = 28;
var crowns = [5,10,15,25,50,100]
var crownWeights = [20,10,10,5,5,2];

var fightEmoji = "567468758294200320";
var blockEmoji = "567468785670291456";
var forwardEmoji = "567468996014899240";
var descendEmoji = "567866647369613341";
var inventoryEmoji = "567866805763440640";
var gateEmoji = "567867432300183562";
var bidEmoji = "569973521124425758";
var buyEmoji = "569973669376426000";



bot.on('ready', () => {
    console.log('The Arcade is up and running.')
})

setInterval(function() {
    Update();
    
}, 1000);
//Update is ran every second.
function Update(){
    Gate();
    /*
    for(var key in auctions){
        if(auctions[key].time != null){
            auctions[key].time = auctions[key].time - 1;  
            if(auctions[key].time <= 0){
                UpdateAuction(key,auctions[key].time,auctions[key].bid);
            }
            fs.writeFile('Storage/auctions.json', JSON.stringify(auctions), (err) =>{
                if (err) console.error(err);
            })   
        }      
    }*/
}
function Interact(room,player){
    const interaction = new Discord.RichEmbed();
    interaction.setTitle(userData[player].name + "'s Interaction")
    interaction.addField(room.interaction,"Interesting.")
    interaction.addField(room.spawn + " has appeared!", "Oh no!")
    if(room.spawn != null){
        enemies.depth[userData[player].depth].location[userData[player].location].enemy = {};
        enemies.depth[userData[player].depth].location[userData[player].location].enemy = monsters[room.spawn];
        SaveData();
    }
    PartyAction(interaction,player);
}
function BidAuction(auction,bid,player){
    ////console.log("Bid");
        if(userData[player].crowns >= auctions[auction].minimum){
           // //console.log("Enough Crowns");
            
            if(auctions[auction].bidder === player){
                userData[player].crowns += auctions[auction].bid;
            }
            userData[player].crowns -= bid;
            auctions[auction].bidder = player;
            auctions[auction].bid = bid;
            UpdateAuction(auction,auctions[auction].time,auctions[auction].bid);
        }
}  
function GenerateID(){
    var newID = Math.floor(Math.random() * 100000);
    ////console.log(newID);
    return newID;
}
function NewAuction(item,amount,bid,price,time,player){
        var auction = GenerateID();
        auctions[auction] = {};
        auctions[auction].item = item;
        auctions[auction].amount = amount;
        auctions[auction].time = time;
        auctions[auction].bid = bid;
        auctions[auction].minimum = Math.floor(bid * 1.2);
        auctions[auction].price = price;
        auctions[auction].lister = player;
        auctions[auction].id = auction;
        

        var auctionHouse = bot.channels.get('569690807913807878');
        const newAuction = new Discord.RichEmbed()
        newAuction.setTitle(userData[player].name + "'s Auction")
        newAuction.addField(amount + " " + item + "(s)" + " is being auctioned for a buy out of " + price,"It currently has a bidding of " + bid + " you must bid a minimum of " + auctions[auction].minimum + " to become top bidder." )
        newAuction.addField("AUCTION ID: " + auction  , " Use this number to bid on this auction." )
        auctionHouse.send(newAuction).then ( myAuction => {
            auctions[auction].instance = myAuction.id;
        });
}
function UpdateAuction(auction,time,bid){
        //Update bid, time, and minimum bid
        ////console.log("Update Auction");
        auctions[auction].time = time;
        auctions[auction].bid = bid;
        auctions[auction].minimum = Math.floor(bid * 1.2);
       
        const update = new Discord.RichEmbed()
        update.setTitle(userData[auctions[auction].lister].name + "'s Auction")
    
        if(auctions[auction].time <= 0 || auctions[auction].bid >= auctions[auction].price){
            if(auctions[auction].bidder != null){
                //Winner!
                AddItem(auctions[auction].item,auctions[auction].bidder);
                userData[auctions[auction].lister].items[auctions[auction].item].amount -= auctions[auction].amount;
                update.addField(userData[auctions[auction].bidder].name + " has won the auction of " + auctions[auction].item + " for " + auctions[auction].bid + " crowns!", "Congratulations!")
                var auctionHouse = bot.channels.get('569690807913807878');
                auctionHouse.fetchMessage(auctions[auction].instance). then (instance => {
                    instance.edit(update);  
                    auctions[auction] = {};
                })
                return;
            } else {
                //Unsold...
                AddItem(auctions[auction].item,auctions[auction].lister);
                update.addField(userData[auctions[auction].lister].name + "'s item(s) have went unsold.", "Sorry, better luck next time!")
                var auctionHouse = bot.channels.get('569690807913807878');
                auctionHouse.fetchMessage(auctions[auction].instance). then (instance => {
                    instance.edit(update);  
                    auctions[auction] = {};
                })   
                return;
            }    
        } else {
        update.addField(auctions[auction].amount + " " + auctions[auction].item + "(s)" + " is being auctioned for a buy out of " + auctions[auction].price,"It currently has a bidding of " + auctions[auction].bid + " you must bid a minimum of " + auctions[auction].minimum + " to become top bidder." )
        update.addField("The top bidder is...",userData[auctions[auction].bidder].name)
        update.addField("AUCTION ID: " +  auctions[auction].id, "Use this to bid on the auction.")
        }
        var auctionHouse = bot.channels.get('569690807913807878');
        auctionHouse.fetchMessage(auctions[auction].instance). then (instance => {
            instance.edit(update);  
        })
}
//Should return the theming of the gate.
//Monster Family and Status.
//Levels with the "any" theme can be found in any gate.
//All other levels will be theme specific.
function GetTheme(){
    //Get the minerals
    var crimsonite = gate.minerals["CRIMSONITE"];
    var darkmatter = gate.minerals["DARK MATTER"];
    var luminite = gate.minerals["LUMINITE"];
    var moonstone = gate.minerals["MOONSTONE"];
    var valestone = gate.minerals["VALESTONE"]; 

    //Possible Themes
    var beast = crimsonite + valestone;
    var slime = valestone + luminite;
    var gremlin = crimsonite + moonstone;
    var construct = moonstone + luminite;
    var fiend = crimsonite + darkmatter;
    var undead = luminite + darkmatter;
    var fire = crimsonite + luminite;
    var freeze = valestone + moonstone;
    var poison = valestone + darkmatter;
    var shock = moonstone + darkmatter;

    //Get the highest number and that's the chosen theme.
    var families = [beast,slime,gremlin,construct,fiend,undead];
    //////console.log(families);
    var newFamily = Math.max(...families);
    var status = [fire,freeze,poison,shock];
    var newStatus = Math.max(...status);
    if(beast === newFamily && slime === newFamily && gremlin === newFamily && construct === newFamily && fiend === newFamily && undead == newFamily){
        newFamily = "random";
    } else if(beast === newFamily){
        newFamily = "beast";
    } else if (slime === newFamily){
        newFamily = "slime";
    } else if (gremlin === newFamily){
        newFamily = "gremlin";
    } else if (construct === newFamily){
        newFamily = "construct";
    } else if (fiend === newFamily){
        newFamily = "fiend";
    } else if (undead === newFamily){
        newFamily = "undead";
    }
    if(fire === newStatus){
        newStatus = "fire";
    } else if(freeze === newStatus){
        newStatus = "freeze";
    } else if (poison === newStatus){
        newStatus = "poison";
    } else if(shock === newStatus){
        newStatus = "shock";
    }
    //Our new combination!
    var newCombination = [newFamily,newStatus];

    //////console.log("This gate's theming is... ",newCombination);
    return newCombination;
}
function Gate(){
    gate.lifeTime += 1;
    gate.maxLife = 3600;
    if(gate.lifeTime > gate.maxLife){
        gate.lifeTime = 0;
        var newTheme = GetTheme();
        gate.theme = newTheme;
        gate.minerals["CRIMSONITE"] = 0;
        gate.minerals["DARK MATTER"] = 0;
        gate.minerals["LUMINITE"] = 0;
        gate.minerals["VALESTONE"] = 0;
        gate.minerals["MOONSTONE"] = 0;
        gate.depthscale = {};
        
        dungeon.depth = {};
        for(var j = 0; j < maxDepth; j++){
            gate.depthscale[j] = 1 + (j / 2);
        }
        for(var i = 0; i < maxDepth; i++){
            dungeon.depth[i] = {};
        }    
        enemies.depth = {};
        for (var key in dungeon.depth){        
            var chosenArea = CreateLoot(dungeons["Config"].names,dungeons["Config"].weights);
            if(!dungeons[chosenArea].theme.includes("any")){
                while(!dungeons[chosenArea].theme.includes(newTheme[0])){
                    chosenArea = CreateLoot(dungeons["Config"].names,dungeons["Config"].weights);
                }
            }
            
            dungeon.depth[key] = GenerateDungeon(chosenArea);
            
            enemies.depth[key] = {};
            enemies.depth[key].location = {};
           
            for (var i = 0; i < dungeon.depth[key].currentrooms.length; i++){ 
                enemies.depth[key].location[i] = {};   
                if(rooms[dungeon.depth[key].currentrooms[i]].monster != null){
                    enemies.depth[key].location[i].enemy = {};
                } else if(rooms[dungeon.depth[key].currentrooms[i]].scenario != null){
                    enemies.depth[key].location[i].enemy = {};     
                }
                
                enemies.depth[key].location[i].enemy.health = 0;
            }
           
        }
        
        
        for (var key in gate.minerals){
            gate.minerals[key] = 0;
        }
        
        for(var key in userData) {
            userData[key].enemy = null;
            userData[key].health = userData[key].maxHealth;
            userData[key].location = 0;
            userData[key].downTime = 0;
            userData[key].depth = 0;
        }
        
        
        var channel = bot.channels.get("569295829987360768");
        var levels = [];
        for (var key in dungeon.depth){
            levels.push("Depth " + key + ", " + dungeon.depth[key].name);
            
        }
        
      //  //console.log(dungeon.depth);
        const embed = new Discord.RichEmbed()
        .setTitle("Gate Creation")
        .addField('A new dungeon has been generated, it has levels', levels)
        .setThumbnail("https://i.imgur.com/KTD2rHD.png")
        .setColor(0xFCF200)
        channel.send(embed);
    }
}
function CheckGate(player){
    Log(userData[player].name + " is checking the gate.");
    var players = [];
    var yourEnemy = enemies.depth[userData[player].depth].location[userData[player].location].enemy;
    for(var key in userData){
        if(userData[key].location === userData[player].location && userData[key].name != userData[player].name && userData[key].depth === userData[player].depth){
            players.push(userData[key].name)
        }
    }
    if(players.length === 0){
        players.push("nobody");
    }

    var levels = [];
        for (var key in dungeon.depth){
            levels.push("Depth " + key + ", " + dungeon.depth[key].name);    
        }
    var minerals = [];
        for (var key in gate.minerals){
            minerals.push(key  + ": " + gate.minerals[key]);
        }

    const embed = new Discord.RichEmbed()
        embed.setTitle("Gate")
        embed.addField("The current dungeon is " + dungeon.depth[userData[player].depth].name, "You have reached room " + (userData[player].location + 1) + " out of " + dungeon.depth[userData[player].depth].currentrooms.length + " of this dungeon.")
        if(yourEnemy != null){
            embed.addField("You are currently facing off against " + yourEnemy.name , "It has " + yourEnemy.health + " health remaining.")
        }
        embed.addField("You are at depth: " + userData[player].depth + " of the current gate", "You have quite a ways to go.")
        embed.addField("There is " + Math.floor((gate.maxLife - gate.lifeTime)/60) + " minutes remaining before the next gate", "You are with " + players)
        if(minerals.length <= 0){
            minerals.push("None, be the first to input minerals!");
        } 
        embed.addField("Deposited minerals", minerals)
        embed.addField("Gate map",levels);
        embed.setThumbnail("https://i.imgur.com/KTD2rHD.png")
    PartyAction(embed,player);
}
function Check(object,player){
    //The information we are grabbing.
    //console.log(object)
    if(userData[player].location <= 0){
       const failure = new Discord.RichEmbed()
        failure.setTitle("No checking allowed at this location, please move forward.")
        PartyAction(failure,player);
        return;
        
    }
    var check = null;
    for(var key in userData){
        if(userData[key].name.toUpperCase() === object.toUpperCase()){
            check = key;
        }
    }
    for(var key in userData[player].items){
        if(userData[player].items[key].name.toUpperCase() === object.toUpperCase()){
            check = userData[player].items[key].name;
        }
    }
    if(enemies.depth[userData[player].depth].location[userData[player].location].enemy != null){
        if(enemies.depth[userData[player].depth].location[userData[player].location].enemy.name != null){
            if(enemies.depth[userData[player].depth].location[userData[player].location].enemy.name.toUpperCase() === object.toUpperCase()){
                check = enemies.depth[userData[player].depth].location[userData[player].location].enemy;
            }
        } 
    }
    
    if(check === null){
        const failure = new Discord.RichEmbed()
        failure.setTitle("There is nothing with this name to be checked.  Check for capitals and spelling errors. If it's an item, maybe you don't have it.  Or the enemy your are trying to check is already dead.")
        PartyAction(failure,player);
        return;
    }
    const embed = new Discord.RichEmbed()
    embed.setTitle(userData[player].name + "'s Check")
    
    if(check === enemies.depth[userData[player].depth].location[userData[player].location].enemy){
            embed.addField("You are checking " + check.name, "Interesting.")  
        if(check.name === "Basil"){
            embed.addField(check.name + " has these recipes in stock.", check.stock)
        } else {
            embed.addField(check.name + " can be attacked.",check.name + " has " + check.health + " health remaining.")
            embed.addField(check.name + " can retaliate.", check.name + " has " + check.damage + " attack power.")
            embed.addField(check.name + " is weak to " + check.weakness + " damage.", check.name + " resists " + check.resistance + " damage.")
        }
    } else if(userData[check]){
        embed.addField("You are checking " + userData[check].name , "Interesting.")
        embed.addField(userData[check].name + " can be attacked.",userData[check].name + " has " + userData[check].health + " health remaining.")
        embed.addField(userData[check].name + " can retaliate.", userData[check].name + " is wielding " + userData[check].equipped + ", it has " + items[userData[check].equipped].damage + " attack power.")
    } else if (items[check]){
        embed.addField("You are checking " + check, "Interesting.")
        if(items[check].type === "Sword" || items[check].type === "Gun"){
            embed.addField(check + " has " + items[check].damage + " attack power.", "It does " + items[check].damageType + " damage.")
        }
        embed.addField(check + " is a " + items[check].type,items[check].description)
    }
    PartyAction(embed,player);
}
function UseItem(object,player){
    userData[player].items[object].amount -= 1;
    const embed = new Discord.RichEmbed()
    embed.setTitle(userData[player].name +  " is using an item!")
    embed.addField(items[object].name, userData[player].name + " " + items[object].usage)
    //embed.setThumbnail(items[object].art)

    //Different actions here depending on the name and type of said item.
    if(items[object].name === "Spark of Life"){
        userData[player].downTime = 0;
        userData[player].health = userData[player].maxHealth;
    } else if(items[object].name === "Health Capsule"){
        userData[player].health += 10;
    }
    //Vials should be thrown at enemies and do status and damage.
    //Barriers should do damage per turn.
    //Health Capsules should heal.
    //Remedies should cure statuses.
    //Recipes should add a recipe to your learned recipes.
    PartyAction(embed,player);
}
function Buy(target,player){
  
    if(userData[player].crowns >= items[target].crowns){
        userData[player].crowns -= items[target].crowns;
        AddItem(target,player);
        const embed = new Discord.RichEmbed()
        embed.setTitle(userData[player].name + "'s Purchase")
        embed.addField("You've successfully purchased for " + items[target].crowns + " crowns...",target)
        Log(userData[player].name + " has purchased " + items[target].name);
        PartyAction(embed,player);
    } else {
        const embed = new Discord.RichEmbed()
        embed.setTitle(userData[player].name + "'s Purchase failed")
        embed.addField("You don't have enough money to buy that", "Sorry")
        PartyAction(embed,player);
    }  
}
function GenerateDungeon(area){
    ////console.log("Generating Dungeon..." + area);
    var finalArea = {};
   
    var finalArea = dungeons[area];
    
 
    var maxRooms = 12;
    var minRooms = 4;
    var roomSize = Math.floor(Math.random() * maxRooms);
    if(roomSize <= minRooms){
        roomSize = minRooms;
    }
    //console.log(roomSize + " Rooms will be in this dungeon");
    if(dungeons[area].rooms.length > 0){
        finalArea.currentrooms = [];
        for(var i = 0; i < roomSize; i++){
            var randIndex = Math.floor(Math.random() * dungeons[area].rooms.length);
            finalArea.currentrooms.push(dungeons[area].rooms[randIndex]);                                                        
        }  
    }
   // //console.log(finalArea);
   console.log(area + " " + finalArea.currentrooms);
    return finalArea; 
}
function AttackChance(total){
    var rand = Math.floor(Math.random() * 100);
    if(rand <= 0){
        rand = 1;
    }
   
    if(rand <= total){
        return true;
    } else {
        return false;
    }
}
function CreateLoot(loot, weights){
    var top = 0;
    var total = 0;
    for(var j = 0; j < weights.length; j++){
        total+=weights[j];
    }
    var rand = Math.floor(Math.random() * total);
    for(var i = 0; i < loot.length; i++){
        top+=weights[i]; 
        
        if(rand <= top){ 
            return loot[i];                         
        }                 
    }   
}
function AddItem(item, player){ 
    if(items[item]){
        if(!userData[player].items[items[item].name]){
            userData[player].items[items[item].name] = {};
        }
        userData[player].items[items[item].name].name = items[item].name;
        if(userData[player].items[items[item].name].amount != null){
            userData[player].items[items[item].name].amount = userData[player].items[items[item].name].amount + 1; 
        } else {
            userData[player].items[items[item].name].amount = 1;
        }       
        Log(userData[player].name + " has obtained " + item); 
    } 
}
function Forward(player){
    Log(userData[player].name + " is attempting to move forward!");
    if(userData[player].downTime > 0){
        const embed = new Discord.RichEmbed()
        .setTitle(userData[player].name + " You're dead.")
        PartyAction(embed,player);
        return;
    }
    if(enemies.depth[userData[player].depth].location[userData[player].location].enemy != null){
        if(enemies.depth[userData[player].depth].location[userData[player].location].enemy.health != null){
            if(enemies.depth[userData[player].depth].location[userData[player].location].enemy.health > 0 && !rooms[dungeon.depth[userData[player].depth].currentrooms[userData[player].location]].scenario ){
                const embed = new Discord.RichEmbed()
                .setTitle(userData[player].name + " you must clear this area first ")
                PartyAction(embed,player);
                return; 
            }
        }
    }
    /*for(var key in enemies.depth.location){
        if(enemies.depth[userData[player].depth].location[key].enemy === null){
            enemies.depth[userData[player].depth].location[key].enemy = {};
        }
    }*/


    userData[player].location  += 1;

    if(dungeon.depth[userData[player].depth].currentrooms.length <= userData[player].location){
        const embed = new Discord.RichEmbed()
        .setTitle(userData[player].name + " is moving forward! ")
        .addField(userData[player].name + " has reached the end of this dungeon inside of room " + (userData[player].location) + "!", "You'll have to descend to move any further.")
        .setFooter(userData[player].name)
        PartyAction(embed,player);
        userData[player].location = dungeon.depth[userData[player].depth].currentrooms.length - 1;
        return;
    }
    
    var newMob;
    if(rooms[dungeon.depth[userData[player].depth].currentrooms[userData[player].location]].monster){
        newMob = rooms[dungeon.depth[userData[player].depth].currentrooms[userData[player].location]].monster;
    } else {
        newMob = rooms[dungeon.depth[userData[player].depth].currentrooms[userData[player].location]].scenario;
    }
    var myEnemy;
    if(enemies.depth[userData[player].depth] != null){
        if(enemies.depth[userData[player].depth].location != null){
            if(enemies.depth[userData[player].depth].location[userData[player].location] != null){
                if(enemies.depth[userData[player].depth].location[userData[player].location].enemy != null){
                    Log(enemies.depth[userData[player].depth].location[userData[player].location].enemy + " enemy already exists here.");
                    myEnemy = enemies.depth[userData[player].depth].location[userData[player].location].enemy;
                } else {       
                    enemies.depth[userData[player].depth].location[userData[player].location].enemy = {};
                    myEnemy = {};
                    myEnemy.health = 0;
                    Log(myEnemy + " enemy created.");
                }
            } else {
                enemies.depth[userData[player].depth].location[userData[player].location] = {};
                myEnemy = {};
                myEnemy.health = 0;
                Log(myEnemy + " enemy created.");
            }
        } else {
            enemies.depth[userData[player].depth].location = {};
            myEnemy = {};
            myEnemy.health = 0;
            Log(myEnemy + " enemy created.");
        }
    } else {
        enemies.depth[userData[player].depth] = {};
        myEnemy = {};
        myEnemy.health = 0;
        Log(myEnemy + " enemy created.");
    }
    
    if(myEnemy.health <= 0 && rooms[dungeon.depth[userData[player].depth].currentrooms[userData[player].location]].type === "battle"){
        //console.log("New Monster " + monsters[newMob].name);
        myEnemy = monsters[newMob];
        myEnemy.health = Math.floor(monsters[newMob].max * userData[player].depth/9);
        if(myEnemy.health <= 0){
            myEnemy.health = 1;
        }
        myEnemy.turn = monsters[newMob].attackSpeed;
        myEnemy.attackSpeed = monsters[newMob].attackSpeed;
        for(var key in status){
            if(gate.theme.includes(status[key].name)){
                myEnemy.dealStatus = status[key].name;
                myEnemy.statusChance = 20;
            }
        }   
        enemies.depth[userData[player].depth].location[userData[player].location].enemy = myEnemy;
    } else if (rooms[dungeon.depth[userData[player].depth].currentrooms[userData[player].location]].type === "scenario"){
        //console.log("New Scenario");
        myEnemy = scenarios[newMob];
        //SCENARIO SETUP
        if(myEnemy.name === "Basil"){
            //console.log("It's Basil!");
            for(var i = 0; i < myEnemy.amount; i++){
                var newItem = CreateLoot(myEnemy.lootTable,myEnemy.lootWeights);
                if(!myEnemy.stock.includes(newItem)){
                    //console.log("Doesn't have this item, add it!");
                    myEnemy.stock.push(newItem);
                }   
            }      
        }
        enemies.depth[userData[player].depth].location[userData[player].location].enemy = myEnemy;
    } else {
        //console.log("Enemy Exists here");
    }
     
    var players = [];
    for (var key in userData){
        if(userData[player].location === userData[key].location && userData[player].name != userData[key].name && userData[player].depth === userData[key].depth){
            players.push(userData[key].name);
        }
    }
    if(players.length === 0){
        players.push(" nothing else...")
    }
    
    const embed = new Discord.RichEmbed()
        .setTitle(userData[player].name + " is moving forward! ")
        .addField(userData[player].name + " has encountered " + myEnemy.name + " inside of room " + (userData[player].location) + "!", userData[player].name + " has also encountered " + players)
        .setThumbnail(myEnemy.art)
        .setFooter(userData[player].name)
    PartyAction(embed,player);
}
function Descend(player){
    Log(userData[player].name + " is attempting to descend!");
    if(userData[player].downTime > 0){
        const embed = new Discord.RichEmbed()
        .setTitle(userData[player].name + " You're dead.")
        PartyAction(embed,player);
        return;
    }
    if(dungeon.depth[userData[player].depth].currentrooms.length - 1 <= userData[player].location){
        userData[player].location = 0;
        userData[player].depth += 1;
        var otherPlayers = [];
        for (var key in userData){
            if(userData[player].location === userData[key].location && userData[player].name != userData[key].name && userData[player].depth === userData[key].depth){
                otherPlayers.push(userData[key].name);
            }
        }
        if(otherPlayers.length === 0){
            otherPlayers.push(" nothing else...")
        }   
        const embed = new Discord.RichEmbed()
        .setTitle(userData[player].name + " is descending to depth " + userData[player].depth + "...")
        .addField(userData[player].name + " has reached " + dungeon.depth[userData[player].depth].name + " and is inside of room " + (userData[player].location + 1) + " of the dungeon!", userData[player].name + " has also encountered " + otherPlayers)
        .setThumbnail(dungeon.depth[userData[player].depth].art)
        .setFooter(userData[player].name)
        PartyAction(embed,player);
    } else {
        const embed = new Discord.RichEmbed()
        .setTitle(userData[player].name + " is descending... ")
        .addField(userData[player].name + " you cannot descend right now, reach the end of the dungeon.")
        PartyAction(embed,player);
    }
}
function Fight(target, player,defend){
    Log(userData[player].name + " is attempting to fight " + target);
    if(userData[player].downTime > 0){
        const embed = new Discord.RichEmbed()
        .setTitle(userData[player].name + " You're dead.")
        PartyAction(embed,player);
        return;
    }
    
    var myName = userData[player].name;
    var defense = 0;
    var myEnemy = enemies.depth[userData[player].depth].location[userData[player].location].enemy;
    if(myEnemy != null){
        if(myEnemy.health <= 0){
            const embed = new Discord.RichEmbed()
            .setTitle(userData[player].name + " Enemy is already dead.")
            PartyAction(embed,player);
            return;
        }
    }
    var weapon = items[userData[player].equipped]; 
    let damage = items[userData[player].equipped].damage; 
    var canAttack = true;
    const embed = new Discord.RichEmbed()
    if(userData[player].status != null){
        userData[player].status.duration -= 1;
        
        
        switch(userData[player].status.name){
            //Damage over time
            case 'fire':
                userData[player].health -= userData[player].status.damage;
                embed.addField(userData[player].name + " is on fire! ",  "Took " + userData[player].status.damage + " damage from fire! " + userData[player].health + " health remaining." )
            break;
            //Can't move forward
            case 'freeze':
            break;
            //Less Damage can't heal
            case 'poison':
                damage *= userData[player].status.damage;
                embed.addField(userData[player].name + " isn't feeling so good! ",  userData[player].name + " is doing less damage.")
            break;
            //Randomly doesn't attack
            case 'shock':
                userData[player].health -= userData[player].status.damage;
                embed.addField(userData[player].name + " spasmed out! ", " and took " + userData[player].status.damage + " damage from shock!")
                canAttack = false;
            break;
            //Higher chance to miss
            case 'stun':
            break;
            //Take damage when you attack
            case 'curse':
                if(!defend){
                    userData[player].health -= userData[player].status.damage;
                    embed.addField(userData[player].name + " is cursed! ", " and took " + userData[player].status.damage + " damage from curse!")
                }    
            break;
            //Disable all commands
            case 'sleep':
                embed.addField(userData[player].name + " is really tired... ",  userData[player].name + " is asleep!")
                canAttack = false;
            break;
        }
        if(userData[player].status.duration <= 0){
            embed.addField(userData[player].status.name + " has worn off", userData[player].name + " is no longer affected by it!")
            userData[player].status = null;
        }
    }
 
    //Unique Enemy AI
    if(myEnemy.name === "Devilite" || myEnemy.name === "Overtimer"){
        myEnemy.turn -= Math.floor(Math.random() * 4);
    } else {
        myEnemy.turn -= 1;
    }
    if(defend === false){
        //console.log("Fighting!")
        if(canAttack){
            defense = 0;
            if(myEnemy.weakness === items[userData[player].equipped].damageType){
                damage = Math.floor(damage * 1.5);
            } else if (myEnemy.resistance === items[userData[player].equipped].damageType){
                damage = Math.floor(damage * 0.5);
            }
            if(weapon.multihit){
                for(var i = 0; i < weapon.multihit; i++){
                    if(AttackChance(weapon.chance)){
                        embed.addField("You hit again!","Bam!")
                        damage += weapon.damage;
                    }         
                }
            }
            myEnemy.health -= damage;
        } else {
            embed.addField(userData[player].name + " can't attack! ", "Oh No!")
        }
        
    } else if (defend === true){
        defense = 2; //TODO: Shields and defense strength
        embed.addField(userData[player].name + " is defending!", "They'll take less damage this turn!")
        embed.addField(myEnemy.name + " has " + myEnemy.turn  + " turns until it attacks!", "Get ready!")
    }
   
            //Monster Attacks
            
            var monster = false;
            if(myEnemy.turn <= 0){
                var success = AttackChance(items[userData[player].equipped].range);
                myEnemy.turn = myEnemy.attackSpeed;
                monster = true;
                if(success){
                    //Enemy hits you
                    var finalDamage = myEnemy.damage - defense;
                    userData[player].health -= finalDamage;
                    if(myEnemy.statusChance != null){
                        var statusChance = AttackChance(myEnemy.statusChance);
                        if(statusChance){
                            userData[player].status = {};
                            userData[player].status = status[myEnemy.dealStatus.toString().toUpperCase()]; 
                            userData[player].status.duration = 3;
                            embed.addField(userData[player].name + " has caught " + myEnemy.dealStatus, "This isn't good.")
                        }
                    }
                  
                    if(finalDamage <= 0){
                        finalDamage = 0;
                    }
                    embed.setTitle(myEnemy.name)
                    embed.addField(myEnemy.name+ " unleashes an attack!", myName + " took " + finalDamage + " damage!")
                    embed.addField(myName + " has " + userData[player].health + " health remaining!", ". . .")
                    embed.setThumbnail(myEnemy.art)   
                } else {
                    //Enemy Misses attack
                    embed.setTitle(myEnemy.name)
                    embed.addField(myEnemy.name + " unleashes an attack!", myEnemy.name+ " missed!")
                    embed.setThumbnail(myEnemy.art) 
                }            
            }
            //You Attack   
            if(defend === false){
                embed.addField(myName + " attacks " +myEnemy.name + " with " + userData[player].equipped + "!",  myName + " dealt "   + damage + " damage!")
                embed.addField(myEnemy.name + " has " + myEnemy.health + " health remaining!", myEnemy.name + " has " + myEnemy.turn  + " turns until it attacks!")
                embed.setFooter(myName)
            }
            
            if(monster === false){
               // embed.setThumbnail(message.author.avatarURL)
            }   
            
            //If Player Dies
            if(userData[player].health <= 0){
                userData[player].downTime = downTime;
                //console.log("you ded");
                embed.addField(myName + " has fainted", ". . . ")
                embed.addField(myName + " is out of commission...", " Rest In Peace " + userData[player].name)
                embed.addField("You can do !restart", "To go back to the begining of the gate")
               // embed.setThumbnail(message.author.avatarURL)    
            }
            //If Monster Dies
            if(myEnemy.health <= 0){
                
                
                var people = [];
                embed.addField(myEnemy.name + " fainted ", "...")

                for(var key in userData){
                    if(userData[key].location === userData[player].location && userData[key].depth === userData[player].depth){
                        var rewards = CreateLoot(myEnemy.lootTable, myEnemy.lootWeights);
                        var crownRewards  = CreateLoot(crowns,crownWeights);
                        crownRewards = Math.floor(crownRewards * gate.depthscale[userData[player].depth]);
                        people.push(userData[key].name);
                        AddItem(rewards,player);

                        userData[key].experience += Math.floor(myEnemy.exp * gate.depthscale[userData[player].depth]);
                        userData[key].crowns += crownRewards          
                        
                        embed.addField(userData[key].name + "'s Loot", crownRewards + " crowns, and " + rewards)
                    }
                }
                embed.addField(people + " have gained " + myEnemy.exp + " experience points ", "Congrats")
                target = target.toUpperCase();
                myEnemy = null;
                myEnemy = {};
                myEnemy.health = 0;
                enemies.depth[userData[player].depth].location[userData[player].location].enemy = myEnemy;
            }
            for(var key in userData){
                if(userData[key].location === userData[player].location && userData[key].depth === userData[player].depth){
                    PartyAction(embed,key);
                }
            }
        
}
function Inventory(player){
    Log(userData[player].name + " is checking their inventory.");
    if(userData[player].partyInstance === 0){
        return;
    }  
    
    
    const inv = new Discord.RichEmbed() 
    
        var materials = [];
        var usables = [];
        var weapons = [];
        var recipes = [];
        var minerals = [];
        for(var key in userData[player].items) {
            if(userData[player].items[key].amount > 0){
                if(items[key].type === "Material"){
                    materials.push(userData[player].items[key].amount + " " + userData[player].items[key].name);
                } else if (items[key].type === "Sword" || items[key].type === "Gun"){
                    weapons.push(userData[player].items[key].amount + " " + userData[player].items[key].name);
                } else if(items[key].type === "Usable"){
                    usables.push(userData[player].items[key].amount + " " + userData[player].items[key].name);
                } else if (items[key].type === "Recipe"){
                    recipes.push(userData[player].items[key].amount + " " + userData[player].items[key].name);
                } else if (items[key].type === "Mineral"){
                    minerals.push(userData[player].items[key].amount + " " + userData[player].items[key].name);
                }
                //console.log(userData[player].items[key])
            }  
        }
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
        materials.sort();
        usables.sort();
        weapons.sort();
        recipes.sort();
        minerals.sort();
        inv.setTitle(userData[player].name + "'s Inventory")
        inv.addField('Crowns', userData[player].crowns)
        inv.addField('Weapons', weapons)  
        inv.addField('Materials', materials)  
        inv.addField('Minerals', minerals)
        inv.addField('Usables', usables)  
        inv.addField('Recipes', recipes)  
        inv.addField('Equipped', userData[player].equipped)    
       // inv.setThumbnail(message.author.avatarURL)
        inv.setColor(0xFCF200)
    
    PartyAction(inv,player); 
}
function SaveData(){
    fs.writeFile('Storage/userData.json', CircularJSON.stringify(userData), (err) =>{
        if (err) console.error(err);
    })
    fs.writeFile('Storage/enemyInstance.json', JSON.stringify(enemies), (err) =>{
        if (err) console.error(err);
    }) 
    fs.writeFile('Storage/dungeonInstance.json', JSON.stringify(dungeon), (err) =>{
        if (err) console.error(err);
    })
    fs.writeFile('Storage/gate.json', JSON.stringify(gate), (err) =>{
        if (err) console.error(err);
    })
    fs.writeFile('Storage/auctions.json', JSON.stringify(auctions), (err) =>{
        if (err) console.error(err);
    })
}
function PlayerCommands(instance,player){
    var actions = [forwardEmoji,blockEmoji,fightEmoji,inventoryEmoji,gateEmoji,descendEmoji];
    const filter = (reaction, user) => actions.includes(reaction.emoji.id) && user.id === player
    const collector = instance.createReactionCollector(filter, { max: 10000000, time: 2147483647 });
                 collector.on('collect', r => {
                     if(r.emoji.name === 'fight'){
                         if(enemies.depth[userData[player].depth].location[userData[player].location].enemy != null && userData[player].location > 0){  
                             if(enemies.depth[userData[player].depth].location[userData[player].location].enemy.health > 0){
                                Fight(enemies.depth[userData[player].depth].location[userData[player].location].enemy.name.toString().toUpperCase(),player,false);
                             }  else {
                                const embed = new Discord.RichEmbed();
                                embed.setTitle("No enemy to attack.")
                                PartyAction(embed,player);
                              
                            }  
                         } else {
                             const embed = new Discord.RichEmbed();
                             embed.setTitle("No enemy to attack.")
                             PartyAction(embed,player);
                           
                         }
                     } else if (r.emoji.name === 'block'){
                        if(enemies.depth[userData[player].depth].location[userData[player].location].enemy != null && userData[player].location > 0){    
                            Fight(enemies.depth[userData[player].depth].location[userData[player].location].enemy.name.toString().toUpperCase(),player,true);
                         } else {
                             const embed = new Discord.RichEmbed();
                             embed.setTitle("No enemy to defend against.")
                             PartyAction(embed,player);
                           
                         }
                     } else if (r.emoji.name === 'forward'){
                        Forward(player);
                   
                     } else if (r.emoji.name === 'inventory'){
                        Inventory(player);
                   
                     } else if (r.emoji.name === 'descend'){
                        Descend(player);
                       
                     } else if (r.emoji.name === 'gate'){
                        CheckGate(player);
                        
                     }
                    
        });
}
function PartyAction(action, player){
    var channel = bot.channels.get(userData[player].partyChannel); 
    if(userData[player].partyInstance != 0){
        channel.fetchMessage(userData[player].partyInstance).then (sentEmbed =>{         
                 sentEmbed.edit(action);                  
    });           
} else {
    channel.send("Please type in the channel that your party instance is in.");
}}
function Log(action){
    var path = 'Storage/log.txt';
    var currentdate = new Date(); 
    var datetime = "Time: " + currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/" 
                + currentdate.getFullYear() + " @ "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes() + ":" 
                + currentdate.getSeconds();
    fs.appendFileSync(path, action + " " + datetime +'\n', "UTF-8",{'flags': 'a+'}); 
}

bot.on('messageUpdate', message =>{
   // userData[message.author.id].channel = message.channel.id;
    SaveData();
})
bot.on('message', message=> {
    if(message.channel.type === "dm"){
        return;
    } 
    let player = message.author.id;
    
    if(!userData[player]) {
        Log(message.author.username + " a new player has joined the game!");
        userData[player] = {};
        userData[player].name  = message.author.username;
        userData[player].health  = 20;
        userData[player].maxHealth = 20;
        userData[player].rank = "Recruit";
        userData[player].experience = 0;
        userData[player].crowns = 0;   
        userData[player].items = {"Calibur":{"name":"Calibur","amount":1}}; 
        userData[player].equipped = "Calibur";
        userData[player].downTime = 0;
        userData[player].location = 0;
        userData[player].depth = 0;
        userData[player].partyInstance = 0;
        userData[player].partyChannel = null;     
    } 

    userData[player].myChannel = message.channel.id;
    if(message.author.username != userData[player].name){
        userData[player].name  = message.author.username;
    }
    var myRole;
    let args = message.content.substring(prefix.length).split(" ");
    if(message.channel.type === "text"){
        myRole = message.guild.roles.find(role => role.name === "Bot Admin").id;
        ////console.log(myRole);
    }  
   // //console.log(message.channel.type);
    
    
    function CreateParty(instance){
        userData[player].partyInstance = instance.id;
        userData[player].partyChannel = instance.channel.id;
        Log(userData[player].name + " has created a new instance");
    }
    switch(args[0]){
        case 'help':
            const embed = new Discord.RichEmbed()
            .setTitle('Help')
            .addField('Commands', commands)
            .setColor(0xFCF200)
            PartyAction(embed,player);
            message.delete();
        break;
        //Player Inventory
        case 'inventory':
            if(userData[player].myChannel != userData[player].partyChannel){
                message.author.send("Don't do commands in other channels!")
                message.delete();
                return;
            }
        
            if(userData[player].downTime > 0){
                //console.log("You can't do anything!");
                return;
            }
            if(userData[player].partyInstance === 0){
                message.author.send("You need to create a party instance first. do !create");
          
                return;
            }  
            Inventory(player);     
            message.delete();
        break;
        /*
        case 'bid':
            if(!args[1] || !args[2]){
                message.author.send("Invalid Arguments");
                message.delete();
                return;
            }
            var myBid = parseInt(args[2]);
            var auction = args[1];
            if(auctions[auction] != null){
                if(userData[player].crowns >= myBid && myBid >= auctions[auction].minimum){
                    BidAuction(auction,myBid,player);
                } else {
                    message.author.send("Not enough crowns."); 
                }
            } else {
                message.author.send("Invalid ID");
            }
            message.delete();
        break;
*/
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
            //console.log(mineral.toUpperCase())
            if(gate.minerals[mineral.toUpperCase()] != null){
                if(userData[player].items[mineral]){
                    if(userData[player].items[mineral].amount >= amount){
                        gate.minerals[mineral.toUpperCase()] += amount;
                        userData[player].items[mineral].amount -= amount;
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
                    //console.log(args[i]);
                    break;
                } else {
                    //console.log(myItem + " Item doesn't exist");
                    myItem += args[i].toString();
                    if(!items[myItem]){
                        myItem += " ";
                    }       
                }       
            }
            //console.log(myItem);
            if(userData[player].items[myItem] != null){
                if(userData[player].items[myItem].amount > parseInt(args[numbers])){
                    var amount = parseInt(args[numbers]);
                    var bid = parseInt(args[numbers + 1]);
                    var price = parseInt(args[numbers + 2]);
                    var time = parseInt(args[numbers + 3]);
                    if(time != null){
                        NewAuction(myItem,amount,bid,price,time,player);
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
        break; 
        */
        case 'interact':
            if(userData[player].partyInstance === 0){
                message.author.send("You need to create a party instance first. do !create");
                message.delete();
                return;
            } 
            if(userData[player].myChannel != userData[player].partyChannel){
                message.author.send("Don't do commands in other channels!")
                message.delete();
                return;
            }
            if(userData[player].downTime > 0){
                message.author.send("You're dead.");
                message.delete();
                return;
            }
            if(enemies.depth[userData[player].depth].location[userData[player].location].enemy != null){
                if(enemies.depth[userData[player].depth].location[userData[player].location].enemy.interaction != null){
                    Interact(enemies.depth[userData[player].depth].location[userData[player].location].enemy,player);
                }else {
                    message.author.send("Nothing to interact with here");
                }
            } else {
                message.author.send("Nothing to interact with here");
            }
            message.delete();
        break;
        case 'restart':
            userData[player].health = userData[player].maxHealth;
            userData[player].downTime = 0;
            userData[player].depth = 0;
            userData[player].location = 0;
            const restart = new Discord.RichEmbed()
            restart.setTitle("Restarting Gate!")
            restart.addField("Let's try this all over again.", "Back to depth 0!")
            PartyAction(restart,player);
            message.delete();
        break;
        //Equips an item
        case 'equip':
            if(userData[player].myChannel != userData[player].partyChannel){
                message.author.send("Don't do commands in other channels!")
                message.delete();
                return;
            }
        
            if(userData[player].partyInstance === 0){
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
                }
            }
          
            if(userData[player].items[item] && userData[player].equipped != item){ 
                if(items[item].type === "Sword" || items[item].type === "Gun"){
                    userData[player].equipped = item;
                    message.author.send("Equipped " + item)
                    Inventory(player);
                    Log(userData[player].name + " has equipped " + item);
                } else {
                    message.author.send("This is not a weapon.")
                }
                
            } else if (userData[player].equipped === item){
                message.author.send("That equipment is already equipped");
            } else {
                message.author.send("Item does not exist");
            }
            message.delete();
        break;
        case 'fight':
            if(userData[player].myChannel != userData[player].partyChannel){
                message.author.send("Don't do commands in other channels!")
                message.delete();
                return;
            }
            if(userData[player].downTime > 0){
                //console.log("You can't do anything!");
                return;
            }
            if(userData[player].partyInstance === 0){
                message.author.send("You need to create a party instance first. do !create");
               
            return;
            }
            if(userData[player].downTime != 0){
                return;
            }
            if(!args[1]){
                message.author.send("Invalid Arguments");
                return;
            }
            var target = "";
            for(var i = 1; i < args.length; i++){
                target += args[i].toString();
                if(args[i + 1]){
                    target += " ";
                }
            }
            if(enemies.depth[userData[player].depth].location[userData[player].location].enemy != null){   
                //console.log("Fight enemy");
                if(enemies.depth[userData[player].depth].location[userData[player].location].enemy.name.toUpperCase() === target.toUpperCase())    {
                    //console.log("Fight enemy");
                    Fight(target, player , false);
                }  else {
                    message.author.send("This enemy doesn't exist.");
                }         
            }  else {
                message.author.send("This enemy doesn't exist.");
            } 
            message.delete(); 
        break; 
        //Spawns a specific dungeon.
        case 'dungeon':{
            if(message.member.roles.has(myRole)){
                if(!args[1]){
                    message.author.send("Invalid Arguments.");
                    return;
                }
                var wish = args[1].toString();
                if(dungeons[wish]){
                    dungeon[wish] = GenerateDungeon(wish);
                    message.author.send("Wish Granted, Dungeon Created");
                } else {
                    message.author.send("Invalid Dungeon.");
                }
            } else {
                message.author.send("You do not have the neccessary roles.");
            }  
          
        }
        break;
        //Grants any item in the game
        case 'craft':
            if(userData[player].myChannel != userData[player].partyChannel){
                message.author.send("Don't do commands in other channels!")
                message.delete();
                return;
            }
            if(userData[player].downTime > 0){
                //console.log("You can't do anything!");
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
                
                var myItems = userData[player].items;
              
                    if(!myItems[choice + " Recipe"]){
                        //console.log("Can't craft this, don't have the recipe.");
                        craft.addField("Failure", "You don't have this recipe.")
                        message.delete();
                        PartyAction(craft,player);
                        return;
                    }
                    var attemptcraft = [];
                    var missing = [];
                    for(var i = 0; i < items[choice + " Recipe"].needed.length; i++){
                        var requirement = items[choice + " Recipe"].needed[i];
                        //console.log(requirement);
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
                        //console.log("Missing Materials!");
                    } else {
                        //console.log("Crafting Success!");
                        for(var i = 0; i < items[choice + " Recipe"].needed.length; i++){
                            var requirement = items[choice + " Recipe"].needed[i];
                            userData[player].items[requirement].amount -= items[choice + " Recipe"].amounts[i];
                            //console.log("Removing Materials...");
                        }
                        craft.addField("Success!", "Enjoy your new " + choice)
                        AddItem(choice,player);
                    }
                
            } else {
                //console.log("Can't craft this, don't have the recipe.");
                craft.addField("Failure", "this item doesn't exist") 
            }
            message.delete();
            PartyAction(craft,player);
        break;
        case'use':
            if(userData[player].partyChannel != message.channel.id){
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
            //console.log(userData[player].name + " is attempting to use " + object + "!");
            if(items[object] != null){
                if(userData[player].items[object] != null){
                    if(items[object].type === "Usable"){
                        if(userData[player].items[object].amount > 0){
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
        case 'buy':
            if(userData[player].myChannel != userData[player].partyChannel){
                message.author.send("Don't do commands in other channels!")
                message.delete();
                return;
            }
            if(userData[player].downTime > 0){
                //console.log("You can't do anything!");
                return;
            }
            if(!args[1]){
                message.author.send("Specify Item");
            }
            var purchase = "";
            for(var i = 1; i < args.length; i++){
                purchase += args[i].toString();
                if(args[i + 1]){
                    purchase += " ";
                }
            }
            //console.log(purchase + " I want to buy this ");
            if(enemies.depth[userData[player].depth].location[userData[player].location].enemy.name === "Basil"){
                //console.log("Basil is here")
                if(enemies.depth[userData[player].depth].location[userData[player].location].enemy.stock.includes(purchase)){
                    Buy(purchase,player);
                } else {
                    message.author.send("Basil isn't here or that item isn't available");
                }
            }   
            message.delete();
        break;
        case 'grant':
            if(message.member.roles.has(myRole)){
                if(!args[1]){
                    message.author.send("Invalid Arguments.");
                    return;
                }
                var wish = "";
                for(var i = 1; i < args.length; i++){
                        wish += args[i].toString();
                    if(args[i + 1]){
                        wish += " ";
                    }
                }
                if(items[wish]){
                    AddItem(wish,player);   
                    message.author.send("Wish Granted.");
                } else {
                    message.author.send("Invalid Item.");
                }
            } else {
                message.author.send("You do not have the neccessary roles.");
            }  
            message.delete();
        break;
        //Restarts the dungeon, pututing you at location 1 depth 0
        case 'start':{
            if(message.member.roles.has(myRole)){
                message.channel.send("Retarting Dungeon!");
                userData[player].location = 1;
                userData[player].depth = 0;
            } else {
                message.author.send("You do not have the neccessary roles.");
            }   
                  
        }
        break;
        //Creates a party instance for the player, this is what you use to play the game.
        case 'create':{
            if(userData[player].downTime > 0){
                //console.log("You can't do anything!");
                return;
            }
            //The Party Instance id is automatically set to 0 from the start.
            const embed = new Discord.RichEmbed();
            //Can create private parties, which creates an entire channel for you.
            if(args[1] === "private"){
                var server = message.guild;
                var name = message.author.username;
                let playerRole = message.guild.roles.find('name', name);
                let playerChannel = message.guild.channels.get(userData[player].partyChannel);
                
                if(playerRole != null){
                    playerChannel.delete();
                    playerRole.delete();
                    message.author.send("Deleting old party...")
                }
                let everyone = message.guild.roles.find('name', "@everyone");
                let botAdmin = message.guild.roles.find('name', 'Bot Admin');
                message.guild.createRole(name,name).then (newRole =>{
                    server.createChannel(name, "text").then (myServer =>{
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
                    newRole.setName(name, "text");
                    message.member.addRole(newRole);
                    embed.setTitle(userData[player].name + "'s instance")
                        myServer.send(embed).then  (sentEmbed =>{
                            sentEmbed.react(fightEmoji);
                            sentEmbed.react(blockEmoji);
                            sentEmbed.react(forwardEmoji);
                            sentEmbed.react(inventoryEmoji);
                            sentEmbed.react(gateEmoji);
                            sentEmbed.react(descendEmoji);
                            CreateParty(sentEmbed);
                            PlayerCommands(sentEmbed,player);
                            
                        });       
                }) 
                });
                   
            } else {
                message.author.send("No public instances allowed at this time.");
                return;
                embed.setTitle(userData[player].name + "'s instance")
                message.channel.send(embed).then  (sentEmbed =>{
                    CreateParty(sentEmbed);
                })
            }
               
        }
        break;
        //Gives information about where you are in the current dungeon, as well as gate info.
        case 'test':{
            Log(message);
        }
        break;
        case'gate':{
            if(userData[player].myChannel != userData[player].partyChannel){
                message.author.send("Don't do commands in other channels!")
                message.delete();
                return;
            }
            if(userData[player].downTime > 0){
                //console.log("You can't do anything!");
                return;
            }
            if(userData[player].partyInstance === 0){
                message.author.send("You need to create a party instance first. do !create");
                
                return;
            }
            CheckGate(player);
            message.delete();
        }
        break;
        //Move forward
        case 'forward':{
            if(userData[player].myChannel != userData[player].partyChannel){
                message.author.send("Don't do commands in other channels!")
                message.delete();
                return;
            }
            if(userData[player].downTime > 0){
                //console.log("You can't do anything!");
                return;
            }
            if(userData[player].partyInstance === 0){
                message.author.send("You need to create a party instance first. do !create");
              
                return;
            }
            Forward(player);     
            message.delete();
        }
        break;
        //Move to the next depth of the gate
        case 'descend':{
            if(userData[player].myChannel != userData[player].partyChannel){
                message.author.send("Don't do commands in other channels!")
                message.delete();
                return;
            }
            if(userData[player].downTime > 0){
                //console.log("You can't do anything!");
                return;
            }
            if(userData[player].partyInstance === 0){
                message.author.send("You need to create a party instance first. do !create");
         
                return;
            }     
            Descend(player);
            message.delete();
        }
        break;
        //Images for the bot.
        case 'rsrc':
            if(message.member.roles.has(myRole)){
                message.author.send(resources);
            } else {
                message.author.send("You do not have the neccessary roles.");
            }  
            message.delete();
        break;
        //Clears player inventory.
        case 'clear':
            if(message.member.roles.has(myRole)){
                userData[player].items = {"Recruit Badge":{"name":"Recruit Badge","amount":1}};
                message.author.send("Inventory Cleared");
            } else {
                message.author.send("You do not have the neccessary roles.");
            }   
            message.delete();
        break;
        //Ends the current gate and makes a new one generate.
        case 'force':
            if(message.member.roles.has(myRole)){
                gate.lifeTime = 999999999;
                message.author.send("Gate Forced");
            } else {
                message.author.send("You do not have the neccessary roles.");
            }     
            message.delete();
        break;
        case 'money':
            if(message.member.roles.has(myRole)){
                userData[player].crowns += 999999999;
                message.author.send("Rich Boy");
            } else {
                message.author.send("You do not have the neccessary roles.");
            }     
        message.delete();
        break;
        case 'check':
            if (userData[player].partyChannel != message.channel.id) {
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
            //console.log("Attempting to check in the room: " + object + "!");
            Check(object, player);   
            message.delete();
        break;
        
    }  
    
    //All Data we need to keep track of
    SaveData();
})

bot.login(process.env.TOKEN);
