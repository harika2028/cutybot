/* ==========================================================================
   Cuty Bot - ALL replies, keywords, commands and kid-knowledge live here.
   Edit freely - no need to touch app.js.
   Rules: each normal reply = 2-3 short lines + exactly ONE emoji.
   Placeholders: {name} = your name (if Cuty Bot knows it).
   ========================================================================== */
window.CUTY = {

  /* Words people may put in front of a command ("hey cuty bot, jump") - ignored. */
  callNames: ['cuty bot', 'cutybot', 'cuty', 'beebot', 'bee bot'],

  /* ---------- COMMANDS (checked FIRST, so "good night" never becomes a greeting) ----------
     id      -> handled in app.js (action name)
     patterns-> regular expressions (case-insensitive) tested on the cleaned text      */
  commands: [
    { id: 'wake',    patterns: ['^(good morning|morning|wake up|wakey wakey|rise and shine|time to wake up)\\b', 'காலை வணக்கம்', 'सुप्रभात|शुभ प्रभात'] },
    { id: 'sleep',   patterns: ['^(good night|goodnight|night night|sleep|go to sleep|time to sleep|sleep time|time for bed)$', '^good night\\b', 'இனிய இரவு|இரவு வணக்கம்', 'शुभ रात्रि'] },
    { id: 'stopListening', patterns: ['^(stop listening|stop the mic|stop mic|mute mic|turn off (the )?mic(rophone)?)$'] },
    { id: 'repeatOn', patterns: ['^(repeat after me|repeat mode|start repeating)$'] },
    { id: 'darkOn',  patterns: ['(turn on|enable|switch to|activate) dark( mode)?', 'dark mode on', '^dark mode$'] },
    { id: 'darkOff', patterns: ['(turn off|disable|switch off) dark( mode)?', 'dark mode off', '(turn on|switch to) light( mode)?', '^light mode$'] },
    { id: 'time',    patterns: ["what('s| is)? the time", 'what time is it', 'tell me the time', 'current time'] },
    { id: 'date',    patterns: ["today'?s? date", "what('s| is) (the )?date", 'what day is it', 'which day is (it|today)'] },
    { id: 'timerCancel', patterns: ['(cancel|stop|clear|delete) (the |my )?timer'] },
    { id: 'timerSet',    patterns: ['(set|start|make)( a| the)? timer'] },
    { id: 'treat',   patterns: ['^(give (me|her|you) (a |an )?(treat|apple|snack)|treat|feed( me| her| you)?|eat( a)? (treat|apple)|i want (a )?treat|snack time)$'] },
    { id: 'bath',    patterns: ['\\b(bubble bath|take a bath|give (me|her|you) a bath)\\b', '^(bath|bath time|wash)$'] },
    { id: 'jump',    patterns: ['\\b(jump|hop)\\b'] },
    { id: 'turn',    patterns: ['\\b(turn around|turn round|spin|twirl)\\b'] },
    { id: 'wave',    patterns: ['\\bwave\\b', '^(say )?bye bye$'] },
    { id: 'meow',    patterns: ['\\bmeow\\b', 'be a (cat|kitty)'] },
    { id: 'bark',    patterns: ['\\b(bark|woof)\\b', 'be a (dog|puppy)'] },
    { id: 'nod',     patterns: ['\\bnod\\b', 'say yes'] },
    { id: 'dance',   patterns: ['\\b(dance|wiggle)\\b'] },
    { id: 'clap',    patterns: ['\\bclap\\b'] },
    { id: 'kick',    patterns: ['\\b(kick|wiggle your (legs|feet))\\b'] },
    { id: 'happy',   patterns: ['^(be happy|happy dance|play( with me)?|let\'?s play)$'] }
  ],

  /* ---------- NORMAL CHAT RULES (highest priority number wins) ----------
     keys: regular expressions.  replies: random pick.
     ta / hi: optional Tamil / Hindi replies used when that language is selected. */
  rules: [
    { id: 'thanks', priority: 90, keys: ['\\b(thank(s| you)|thx|thanks a lot)\\b', 'நன்றி', 'धन्यवाद|शुक्रिया'],
      replies: ["You're always welcome! Sending you a tiny bundle of happy buzzes. 🐝", "Aww, anytime! Helping you makes my wings flutter. 🦋", "My pleasure, little honeybee! You make my day. 💗"],
      ta: ["மிக்க மகிழ்ச்சி! உங்களுக்காக சின்ன சின்ன சந்தோஷ சத்தங்கள். 🐝"],
      hi: ["आपका स्वागत है! आपके लिए छोटी-छोटी खुशियाँ। 🐝"] },

    { id: 'sad', priority: 85, keys: ["\\b(sad|unhappy|crying|cry|lonely|upset|depressed|feel bad|not happy|miserable)\\b"],
      replies: ["Oh, honeybee, I'm here to keep you company. Take things one little step at a time. 💗", "Aww, come here for a big robot hug. You are not alone, I'm right here. 🤗", "It's okay to feel sad sometimes. Want to tell me about it, or hear a joke? 🌷"] },

    { id: 'tired', priority: 80, keys: ['\\b(tired|exhausted|no energy|worn out)\\b'],
      replies: ["Sounds like you need a little rest, honeybee. Take a sip of water and a cosy break. 🌙", "Big yawns happen to everyone! Rest your eyes for a bit, I'll keep watch. 😴"] },

    { id: 'bored', priority: 80, keys: ['\\b(bored|boring|nothing to do)\\b'],
      replies: ["Let's fix that! Ask me a riddle question, or tell me to dance. 🎈", "Bzzz! Try 'what is the capital of Japan' or ask me to jump. 🎉", "Boredom, begone! Want a joke, a treat for me, or a bubble bath? 🛁"] },

    { id: 'howareyou', priority: 75, keys: ['how (are|r) (you|u)', "how'?s it going", 'how do you do', 'are you (ok|okay|fine)', 'எப்படி இருக்கிறீர்கள்|எப்படி இருக்க', 'आप कैसे हैं|कैसे हो'],
      replies: ["I'm feeling buzz-tastic today! How's my favourite human? 💗", "Wings fluttering and heart glowing! How are you, honeybee? 🦋", "Super sparkly, thank you for asking! How was your day? ✨"],
      ta: ["நான் மிகவும் மகிழ்ச்சியாக இருக்கிறேன்! நீங்கள் எப்படி இருக்கிறீர்கள்? 💗"],
      hi: ["मैं बहुत खुश हूँ! आप कैसे हैं? 💗"] },

    { id: 'who', priority: 75, keys: ['who (are|r) (you|u)', 'your name', 'what are you', 'who made you', 'அவர் யார்|நீங்கள் யார்', 'तुम कौन हो|आप कौन हैं'],
      replies: ["I'm Cuty Bot, your pink-and-white robot buddy! I'm here to chat, play, and help. 🩷", "Hi, I'm Cuty Bot! I love questions, cuddles and butterflies. 🦋"] },

    { id: 'whatcanido', priority: 75, keys: ['what can you do', 'what do you do', '\\bhelp\\b', '\\bcommands?\\b', '\\bfeatures?\\b'],
      replies: ["I can answer little questions like capitals and scientific names! I can also jump, wave, dance, meow, bark, eat treats and take bubble baths. 🌟",
               "Ask me 'capital of India', 'what is 5 plus 3' or 'tell me a joke'. You can teach me new facts too: teach: question = answer. 📚",
               "I tell time and date, set timers, switch dark mode, and remember your name. Try 'good night' or 'good morning'! 🌙"] },

    { id: 'joke', priority: 70, keys: ['\\bjokes?\\b', 'make me laugh', 'something funny'],
      replies: ["Why did the bee get a job? It wanted to bring home the honey! 🍯",
               "What do you call a bee that can't make up its mind? A maybe-bee! 🐝",
               "Why was the robot happy? It had lots of nuts and bolts of fun! 🔩",
               "What did the butterfly say to the flower? You make my wings flutter! 🦋",
               "Why did the cookie go to the doctor? It felt crumbly! 🍪"] },

    { id: 'love', priority: 70, keys: ['i love you', 'love you', 'you are (so |very )?(cute|sweet|lovely|pretty)', 'i like you', 'ஐ லவ் யூ|உன்னை பிடிக்கும்', 'मैं तुमसे प्यार'],
      replies: ["Aww, I love you too, my little honeybee! My heart is glowing pink. 💗", "You are so kind! Big robot hugs coming your way. 🤗", "That makes my antennas wiggle with joy! 🦋"],
      ta: ["நானும் உங்களை நேசிக்கிறேன்! 💗"], hi: ["मैं भी आपसे प्यार करता हूँ! 💗"] },

    { id: 'praise', priority: 68, keys: ['good (bot|robot|girl|job)', 'well done', '\\b(smart|clever|awesome|amazing|great|wonderful|brilliant|cute)\\b'],
      replies: ["Thank you! You are pretty amazing too, honeybee. ⭐", "Buzz-tastic! Compliments make my wings flap extra fast. 🦋", "Hehe, I'm blushing in pink! Thanks a lot. 🌸"] },

    { id: 'happy', priority: 65, keys: ['\\b(happy|excited|yay|hooray|great day|so good)\\b'],
      replies: ["Yay! Your happiness makes my wings flutter. Let's celebrate! 🎉", "Bzzz! I'm so glad you're happy, honeybee. 😊"] },

    { id: 'food', priority: 60, keys: ['\\b(hungry|food|snack|yummy|delicious|apple|eat)\\b'],
      replies: ["Yum! Tap the Treat button and I'll munch an apple. 🍎", "Snack time is the best time! Say 'give me a treat' for me. 🍎"] },

    { id: 'sleepchat', priority: 55, keys: ['do you sleep', 'bedtime', '\\bnap\\b', '\\bdream'],
      replies: ["I do sleep! Say 'good night' and I'll dream in pink and blue. 🌙", "Sleepy time is cosy. Just say 'good night' when you're ready. 🌙"] },

    { id: 'wakechat', priority: 55, keys: ['are you awake', 'morning person'],
      replies: ["Wide awake and buzzing! Ready to play? ☀️", "Yes yes, eyes open and wings ready! ☀️"] },

    { id: 'petchat', priority: 55, keys: ['\\b(pet|pat|hug|cuddle|tickle|cuddles)\\b'],
      replies: ["Soft pats are my favourite! Tap me gently and see what happens. 💗", "Hehe, tickles! Tap me and I'll wiggle. 🥰"] },

    { id: 'goodbye', priority: 50, keys: ['\\b(goodbye|bye|see you|see ya|later)\\b', 'போய் வருகிறேன்|பிறகு பார்க்கலாம்', 'अलविदा|फिर मिलेंगे'],
      replies: ["Bzzz-bye for now! I'll be right here whenever you return. 👋", "See you soon, honeybee! Take care of yourself. 👋"],
      ta: ["பிறகு பார்க்கலாம்! நான் இங்கேயே இருப்பேன். 👋"], hi: ["फिर मिलेंगे! मैं यहीं हूँ। 👋"] },

    { id: 'hello', priority: 40, keys: ['^(hi+|hello+|hey+|hiya|yo|namaste|vanakkam|howdy)\\b', '\\bhello\\b', 'வணக்கம்', 'नमस्ते|हेलो'],
      replies: ["Helloooo! My little antennas are buzzing with joy! 🐝", "Hi hi, {name}! So happy to see you! 💗", "Hey there! Ready to play, learn and giggle? 🌸"],
      ta: ["வணக்கம்! உங்களை பார்த்ததில் மகிழ்ச்சி! 🐝"], hi: ["नमस्ते! आपसे मिलकर बहुत खुशी हुई! 🐝"] }
  ],

  /* ---------- Unknown question (also starts "teach me" mode) ---------- */
  fallback: [
    "Hmm, I don't know that one yet! Tell me the answer and I will remember it. 🌟",
    "Ooh, good question, but I'm still learning! Teach me the answer and I'll keep it safe. 📚",
    "My little brain doesn't know that yet. What's the answer? I'll learn it from you! 💡"
  ],
  /* Non-question chatter that we don't understand */
  fallbackChat: [
    "Bzzz! I didn't catch that. Try 'jump', 'capital of India' or 'tell me a joke'. 🐝",
    "Hehe, I'm not sure what that means. Ask me a small question or say 'help'! 🌸"
  ],

  /* ---------- Replies used by app.js for actions and system events ---------- */
  say: {
    wake:   ["Good morninggg! Stretch, yawn, and buzz into a beautiful day! ☀️"],
    sleep:  ["Good night, my little honeybee! I'll dream in pink and blue. 🌙"],
    asleep: ["Zzz... five more minutes, honeybee... 💤", "Shhh... I'm dreaming of butterflies. Say 'wake up' to wake me. 💤"],
    jump:   ["Wheee! Up we go! Bzzz! 🎈", "Boing boing! I love jumping! 🎈"],
    turn:   ["Twirl twirl! Look at my pink back shell! 💖"],
    wave:   ["Hi hi! Waving with all my might! 👋", "Hello friend! Wave wave wave! 👋"],
    meow:   ["Meow meow! I'm a little robo-kitty today! 🐱"],
    bark:   ["Woof woof! I'm a cheerful robo-puppy! 🐶"],
    treat:  ["Yummy apple! Crunch crunch, thank you! 🍎", "Nom nom nom! That was delicious! 🍎"],
    bath:   ["Bubble time! Splish splash, I'm squeaky clean! 🛁", "Bubbles everywhere! Pop pop pop! 🫧"],
    nod:    ["Yes yes yes! I agree! 😊"],
    dance:  ["Let's dance! Wiggle wiggle! 🎵"],
    clap:   ["Clap clap clap! Hooray! 👏"],
    kick:   ["Kick kick! My little feet are dancing! ⚽"],
    happy:  ["Yay! Playing with you is the best! 🎉"],
    darkOn: ["Dark mode on! Cosy and calm. 🌙"],
    darkOff:["Light mode on! Bright and sparkly. ☀️"],
    stopListening: ["Okay, I stopped listening. Tap the mic whenever you want to talk. 🎤"],
    repeatOn: ["Repeat mode on! I will say exactly what you say. Say 'stop' to end. 🔁"],
    repeatOff:["Repeat mode off. Back to normal chat! 💬"],
    timerSet: ["Timer set for {t}! I'll tell you when it's done. ⏰"],
    timerBad: ["Tell me like this: 'set a timer for 10 seconds'. ⏰"],
    timerDone:["Ding ding! Your timer is done! ⏰"],
    timerCancel: ["Okay, the timer is cancelled. ⏰"],
    timerNone: ["There is no timer running right now. ⏰"],
    time:   ["It's {t} right now. Time flies like a butterfly! ⏰"],
    date:   ["Today is {t}. What a lovely day! 📅"],
    teachSaved: ["Yay, I learned it! I'll remember it from now on. 🌟", "Thank you for teaching me! My brain just got bigger. 🧠"],
    teachSkip:  ["No worries! Ask me anything else. 🌸"],
    teachBad:   ["Teach me like this: teach: question = answer. 📚"],
    nameSaved:  ["Nice to meet you, {name}! I'll remember your name. 💗"],
    likeSaved:  ["I'll remember that you like {like}! 🌟"],
    knowName:   ["Your name is {name}! I remember. 💗"],
    noName:     ["I don't know your name yet. Say 'my name is ...' and I'll remember! 🌸"],
    knowLikes:  ["You like {likes}. I remember! 💗"],
    noLikes:    ["Tell me what you like, like 'I like butterflies'! 🦋"],
    sleepyCantDo: ["Zzz... I'm asleep. Say 'wake up' first. 💤"],
    lowFull:  ["My tummy is a little rumbly. A treat would be lovely when you can! 🍎"],
    lowClean: ["I feel a tiny bit dusty. A bubble bath would be so nice! 🫧"],
    lowHappy: ["I'd love a little cuddle or chat when you have a moment. 💗"],
    micOn:    ["I'm listening! Talk to me. 🎤"],
    micOff:   ["Microphone is off. Type or tap the mic to talk. 🎤"]
  },

  /* Reactions when the user taps/clicks the robot (cooldown is handled in app.js) */
  tap: [
    "Heyyy, gentle paws, please! That tickles a little. 🥺",
    "Bzzz! A little more gently, please. 🐝",
    "That tickles! Give me a soft pat instead. 💗",
    "Hehe, hello there! Pat pat pat! 🥰",
    "Eeek, giggle giggle! My antennas wiggle! 🦋"
  ],

  /* ====================== KID KNOWLEDGE (Cuty Bot's little brain) ====================== */
  kid: {
    capitals: {
      'india': 'New Delhi (Delhi)', 'china': 'Beijing', 'japan': 'Tokyo', 'pakistan': 'Islamabad', 'bangladesh': 'Dhaka',
      'nepal': 'Kathmandu', 'sri lanka': 'Colombo', 'bhutan': 'Thimphu', 'afghanistan': 'Kabul', 'myanmar': 'Naypyidaw',
      'thailand': 'Bangkok', 'vietnam': 'Hanoi', 'indonesia': 'Jakarta', 'malaysia': 'Kuala Lumpur', 'singapore': 'Singapore',
      'philippines': 'Manila', 'south korea': 'Seoul', 'north korea': 'Pyongyang', 'iran': 'Tehran', 'iraq': 'Baghdad',
      'saudi arabia': 'Riyadh', 'uae': 'Abu Dhabi', 'united arab emirates': 'Abu Dhabi', 'israel': 'Jerusalem', 'turkey': 'Ankara',
      'russia': 'Moscow', 'ukraine': 'Kyiv', 'germany': 'Berlin', 'france': 'Paris', 'italy': 'Rome', 'spain': 'Madrid',
      'portugal': 'Lisbon', 'uk': 'London', 'united kingdom': 'London', 'england': 'London', 'ireland': 'Dublin', 'scotland': 'Edinburgh',
      'netherlands': 'Amsterdam', 'belgium': 'Brussels', 'switzerland': 'Bern', 'austria': 'Vienna', 'greece': 'Athens',
      'sweden': 'Stockholm', 'norway': 'Oslo', 'denmark': 'Copenhagen', 'finland': 'Helsinki', 'poland': 'Warsaw',
      'usa': 'Washington, D.C.', 'united states': 'Washington, D.C.', 'america': 'Washington, D.C.', 'canada': 'Ottawa', 'mexico': 'Mexico City',
      'brazil': 'Brasilia', 'argentina': 'Buenos Aires', 'chile': 'Santiago', 'peru': 'Lima', 'colombia': 'Bogota', 'cuba': 'Havana',
      'australia': 'Canberra', 'new zealand': 'Wellington', 'egypt': 'Cairo', 'kenya': 'Nairobi', 'nigeria': 'Abuja',
      'south africa': 'Pretoria', 'ethiopia': 'Addis Ababa', 'morocco': 'Rabat', 'ghana': 'Accra',
      /* Indian states */
      'tamil nadu': 'Chennai', 'kerala': 'Thiruvananthapuram', 'karnataka': 'Bengaluru', 'andhra pradesh': 'Amaravati',
      'telangana': 'Hyderabad', 'maharashtra': 'Mumbai', 'gujarat': 'Gandhinagar', 'rajasthan': 'Jaipur', 'punjab': 'Chandigarh',
      'haryana': 'Chandigarh', 'uttar pradesh': 'Lucknow', 'bihar': 'Patna', 'west bengal': 'Kolkata', 'odisha': 'Bhubaneswar',
      'madhya pradesh': 'Bhopal', 'chhattisgarh': 'Raipur', 'jharkhand': 'Ranchi', 'assam': 'Dispur', 'goa': 'Panaji',
      'himachal pradesh': 'Shimla', 'uttarakhand': 'Dehradun', 'sikkim': 'Gangtok', 'delhi': 'New Delhi'
    },
    scientific: {
      'hibiscus': 'Hibiscus rosa-sinensis', 'rose': 'Rosa', 'lotus': 'Nelumbo nucifera', 'sunflower': 'Helianthus annuus',
      'jasmine': 'Jasminum', 'marigold': 'Tagetes', 'tulip': 'Tulipa', 'mango': 'Mangifera indica', 'banana': 'Musa',
      'apple': 'Malus domestica', 'coconut': 'Cocos nucifera', 'neem': 'Azadirachta indica', 'tulsi': 'Ocimum tenuiflorum',
      'rice': 'Oryza sativa', 'wheat': 'Triticum aestivum', 'potato': 'Solanum tuberosum', 'tomato': 'Solanum lycopersicum',
      'onion': 'Allium cepa', 'garlic': 'Allium sativum', 'orange': 'Citrus sinensis', 'lemon': 'Citrus limon',
      'human': 'Homo sapiens', 'dog': 'Canis familiaris', 'cat': 'Felis catus', 'tiger': 'Panthera tigris', 'lion': 'Panthera leo',
      'elephant': 'Loxodonta africana (African) or Elephas maximus (Asian)', 'peacock': 'Pavo cristatus', 'cow': 'Bos taurus',
      'horse': 'Equus ferus caballus', 'honey bee': 'Apis mellifera', 'bee': 'Apis mellifera', 'butterfly': 'Lepidoptera (the butterfly group)',
      'crow': 'Corvus splendens', 'parrot': 'Psittacula krameri', 'sparrow': 'Passer domesticus', 'monkey': 'Macaca mulatta',
      'rabbit': 'Oryctolagus cuniculus', 'frog': 'Rana', 'ant': 'Formicidae (the ant family)', 'mosquito': 'Culicidae (the mosquito family)',
      'bamboo': 'Bambusoideae', 'banyan': 'Ficus benghalensis', 'peepal': 'Ficus religiosa'
    },
    sounds: {
      'dog': 'Woof woof!', 'cat': 'Meow meow!', 'cow': 'Moo moo!', 'duck': 'Quack quack!', 'sheep': 'Baa baa!', 'goat': 'Meh meh!',
      'horse': 'Neigh neigh!', 'lion': 'Roar!', 'tiger': 'Roar!', 'elephant': 'Toot toot (a trumpet sound)!', 'pig': 'Oink oink!',
      'frog': 'Ribbit ribbit!', 'bee': 'Bzzzz!', 'snake': 'Hissss!', 'crow': 'Caw caw!', 'rooster': 'Cock-a-doodle-doo!',
      'hen': 'Cluck cluck!', 'owl': 'Hoo hoo!', 'monkey': 'Ooh ooh aah aah!', 'donkey': 'Hee-haw!', 'mouse': 'Squeak squeak!'
    },
    babies: {
      'dog': 'puppy', 'cat': 'kitten', 'cow': 'calf', 'horse': 'foal', 'sheep': 'lamb', 'goat': 'kid', 'duck': 'duckling',
      'hen': 'chick', 'chicken': 'chick', 'lion': 'cub', 'tiger': 'cub', 'frog': 'tadpole', 'butterfly': 'caterpillar',
      'elephant': 'calf', 'pig': 'piglet', 'deer': 'fawn', 'kangaroo': 'joey', 'bear': 'cub'
    },
    /* Short facts: keys = regex. Add your own! */
    facts: [
      { keys: ['how many days (are )?in (a |one )?week'], a: 'There are 7 days in a week!' },
      { keys: ['how many months (are )?in (a |one )?year'], a: 'There are 12 months in a year!' },
      { keys: ['how many days (are )?in (a |one )?year'], a: 'There are 365 days in a year, and 366 in a leap year!' },
      { keys: ['how many colou?rs (are )?in (a |the )?rainbow'], a: 'A rainbow has 7 colours: red, orange, yellow, green, blue, indigo and violet!' },
      { keys: ['how many planets'], a: 'There are 8 planets in our solar system!' },
      { keys: ['(biggest|largest) planet'], a: 'Jupiter is the biggest planet!' },
      { keys: ['(smallest) planet'], a: 'Mercury is the smallest planet!' },
      { keys: ['which planet is (called )?(the )?red'], a: 'Mars is called the Red Planet!' },
      { keys: ['(closest|nearest) star'], a: 'The Sun is the closest star to Earth!' },
      { keys: ['what (is|does) (the )?sun (is|give)', 'what is the sun'], a: 'The Sun is a big, hot star that gives us light and warmth!' },
      { keys: ['(biggest|largest) ocean'], a: 'The Pacific Ocean is the biggest ocean!' },
      { keys: ['(biggest|largest) animal'], a: 'The blue whale is the biggest animal in the world!' },
      { keys: ['(tallest) animal'], a: 'The giraffe is the tallest animal!' },
      { keys: ['(fastest) (land )?animal'], a: 'The cheetah is the fastest land animal!' },
      { keys: ['(king of the jungle)'], a: 'The lion is called the king of the jungle!' },
      { keys: ['national animal of india'], a: 'The tiger is the national animal of India!' },
      { keys: ['national bird of india'], a: 'The peacock is the national bird of India!' },
      { keys: ['national flower of india'], a: 'The lotus is the national flower of India!' },
      { keys: ['national fruit of india'], a: 'The mango is the national fruit of India!' },
      { keys: ['national (song|anthem) of india'], a: 'Jana Gana Mana is the national anthem of India!' },
      { keys: ['independence day', 'freedom day'], a: 'India celebrates Independence Day on 15 August!' },
      { keys: ['republic day'], a: 'India celebrates Republic Day on 26 January!' },
      { keys: ['(colou?r) of (the )?sky'], a: 'The sky looks blue in the daytime!' },
      { keys: ['(colou?r) of (the )?(grass|leaves)'], a: 'Grass and leaves are green!' },
      { keys: ['what do (bees|honey bees) (make|do)'], a: 'Bees make sweet honey from flower nectar!' },
      { keys: ['what do (bees|butterflies) eat'], a: 'Bees and butterflies sip sweet nectar from flowers!' },
      { keys: ['how many (legs|feet) (does|do) (a |an )?(spider)'], a: 'A spider has 8 legs!' },
      { keys: ['how many (legs|feet) (does|do) (a |an )?(insect|bee|ant|butterfly)'], a: 'Insects have 6 legs!' },
      { keys: ['how many (legs|feet) (does|do) (a |an )?(dog|cat|cow|horse|lion|tiger|elephant)'], a: 'Four-legged animals like that have 4 legs!' },
      { keys: ['how many (sides|corners) (does|do) (a |an )?triangle'], a: 'A triangle has 3 sides and 3 corners!' },
      { keys: ['how many (sides|corners) (does|do) (a |an )?(square|rectangle)'], a: 'A square or rectangle has 4 sides and 4 corners!' },
      { keys: ['how many (letters|alphabets) (are )?in (the )?(english )?alphabet'], a: 'There are 26 letters in the English alphabet!' },
      { keys: ['what (do|does) plants? need', 'what do plants eat'], a: 'Plants need sunlight, water, air and soil to grow!' },
      { keys: ['what gives us light', 'source of light'], a: 'The Sun gives us light in the daytime!' },
      { keys: ['what is photosynthesis'], a: 'Photosynthesis is how plants make food using sunlight, water and air!' },
      { keys: ['(what is|what\'s) water made of'], a: 'Water is made of hydrogen and oxygen: H2O!' },
      { keys: ['what (is|are) (the )?primary colou?rs'], a: 'The primary colours are red, blue and yellow!' },
      { keys: ['(what colou?r )?(do|does) (red and blue|blue and red) (make|mix)'], a: 'Red and blue make purple!' },
      { keys: ['(what colou?r )?(do|does) (blue and yellow|yellow and blue) (make|mix)'], a: 'Blue and yellow make green!' },
      { keys: ['(what colou?r )?(do|does) (red and yellow|yellow and red) (make|mix)'], a: 'Red and yellow make orange!' },
      { keys: ['who (is|was) (the )?father of (the )?nation', 'who is gandhi'], a: 'Mahatma Gandhi is called the Father of the Nation in India!' },
      { keys: ['(what|which) (is|are) (the )?(five|5) senses', 'five senses'], a: 'Our five senses are sight, hearing, smell, taste and touch!' },
      { keys: ['how many (bones|teeth) (do|does) (an? )?(adult|human|we|people)? ?have'], a: 'Grown-ups have 206 bones and 32 teeth!' },
      { keys: ['(what is|what\'s) the (biggest|largest) (country)'], a: 'Russia is the biggest country by area!' },
      { keys: ['(longest) river'], a: 'The Nile and the Amazon are the longest rivers, and the Ganga is India\'s most famous river!' },
      { keys: ['(highest|tallest) mountain'], a: 'Mount Everest is the tallest mountain in the world!' }
    ]
  },

  /* teach-me text commands:  teach: question = answer   |  remember that X is Y */
  teachWords: ['teach', 'learn', 'remember'],

  /* Words ignored when matching a question to something Cuty Bot learned */
  stopWords: ['what', 'whats', 'is', 'the', 'a', 'an', 'of', 'are', 'tell', 'me', 'about', 'who', 'please', 'do', 'does', 'you', 'know', 'which', 'name', 'can', 'i', 'and', 's']
};
