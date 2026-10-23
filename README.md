# Cuty Bot 💗 — a 3D robot pet and little-kids AI helper

Pink-and-white 3D robot (real Three.js / WebGL geometry) with two butterfly antennas.
She nods, waves, claps, kicks, dances, jumps, eats treats, takes bubble baths, sleeps and wakes up,
answers small kids' questions ("capital of India", "scientific name of hibiscus", maths, animal sounds…)
and **learns new facts from you** and remembers them.

## 1. Run it
1. Extract `cutybot.zip`.
2. Open the `cutybot` folder in **VS Code** (File → Open Folder).
3. Install the **Live Server** extension (Ritwick Dey), right-click `index.html` → **Open with Live Server**.
4. Use **Chrome or Edge**. (Double-clicking `index.html` also shows the robot, but the microphone needs `http://localhost`, which Live Server provides.)

Three.js r149 is bundled locally in `js/three.min.js` (MIT licence: `assets/THREE-LICENSE.txt`). No CDN, no API key, no internet needed to load the project.

## 2. Playing
* **Tap / click Cuty Bot** – she reacts differently each time (nod, giggle, wiggle, kick, clap, wave, jump) with hearts. Drag to look around her; 🎥 resets the view.
* **Buttons** – Jump, Wave, Turn, Nod, Dance, Clap, Kick, Meow, Bark, Treat, Bath, Happy, Wake, Sleep.
* **Pet bars** – Full / Clean / Happy (0–100), saved on your device. They fall slowly and gently; offline time never drops them below a kind minimum.
* **Day / night** follows your device clock. "Good morning / wake up" → bright day with sun; "good night / sleep" → moon, stars and Zzz until you wake her.

## 3. Kids' questions (built-in "little brain")
Try: `capital of India`, `capital of Tamil Nadu`, `scientific name of hibiscus`, `what sound does a cow make`,
`baby of a dog`, `what is 5 plus 3`, `12 x 4`, `how many days in a week`, `spell cat`, `count to 10`, `national bird of India`.

### Teaching Cuty Bot (learning + memory)
* Ask something she doesn't know → she asks for the answer → just type/say it → she remembers.
* Or teach directly: `teach: colour of the moon = silver`, or `remember that the capital of Kerala is Thiruvananthapuram`.
* 🧠 button shows everything she remembers (and lets you forget single facts or clear everything).
* She also remembers: `my name is Neharika`, `I like butterflies`, `I like pink`.
* Everything is stored only in your browser's localStorage. No recordings, nothing uploaded.

## 4. Voice
* Voice settings are at the top of `js/app.js` (`SPEECH_PITCH` 1.35, `SPEECH_RATE` 0.9, `DEFAULT_LANG`, `PREFERRED_VOICE_NAME`, …).
* ⚙️ settings also has Speak on/off, language, voice list, pitch, speed, volume (all saved).
* **British voice:** pick *English (United Kingdom)*; she auto-prefers a gentle female en-GB voice. Which voices exist depends on your operating system and browser (Edge has many natural voices; Windows can add more under Settings → Time & language → Speech). Choose another from the Voice list any time.
* **Microphone 🎤:** tap once to start continuous listening, tap again to stop (or say "stop listening"). She pauses listening while she talks and resumes after. If it keeps restarting, it stops itself.
  * Permission blocked? Click the lock icon in the address bar → Microphone → Allow → reload.
  * Chrome/Edge speech recognition usually needs an **internet connection** (browser-provided service). It is not guaranteed to work offline. Typing always works.
* **Tamil / Hindi:** speech recognition and a few Tamil/Hindi replies (hello, thanks, goodbye, love, how are you, good morning/night) work if your browser has those voices. Her other answers are in English – add more translations in `js/replies.js` (`ta:` / `hi:` lists).

## 5. Repeat mode
Press **🔁 Repeat OFF** → **🔁 Repeat ON**. She repeats exactly what you type or say. Say/type `stop` (or press the button) to leave.

## 6. Editing her words (no code changes needed)
Everything is in `js/replies.js`:
* `rules` – keywords → replies (higher `priority` wins). Add your own `{ id, priority, keys:[regex], replies:[…] }`.
* `commands` – aliases for actions (e.g. add `'hop hop'` to `jump`). New command ids must also exist in `ACTIONS`/`runCommand` in `app.js`.
* `kid.capitals / scientific / sounds / babies / facts` – the kids' knowledge tables; add lines freely.
* Keep each reply to 2–3 short lines and **one** emoji.

## 7. Assistant commands
"What's the time?", "What's today's date?", "Set a timer for 10 seconds", "Cancel the timer", "Turn on/off dark mode", "Tell me a joke", jump / wave / turn around / meow / bark / give me a treat / give me a bath, "Good morning", "Good night", "Stop listening".
She cannot browse the internet, answer current-events questions, send messages or control smart-home devices – there is no such integration.

## 8. Troubleshooting
* **Black/blank 3D area:** your browser/GPU has WebGL disabled. Enable hardware acceleration; chat still works.
* **No sound:** browsers block audio until you click once. Check 🔊 and the volume slider.
* **No voices listed:** wait a second or reload; some browsers load voices late.
* **Clear everything:** 🧠 → *Clear all memory* (or clear site data in the browser).

## Offline vs online
Works offline: 3D scene, chat, kids' answers, learning, timers, sounds, speech output with installed system voices.
May need internet / OS support: microphone speech recognition (browser cloud service), some "natural" voices.

## Honest testing note
Syntax-checked all files, built the 3D scene with the real Three.js library in a headless Node harness (WebGL stubbed), ran every animation, checked camera framing at 3 aspect ratios, and drove the chat/teach/memory logic with ~40 test messages. Real WebGL rendering, microphone, speech voices and phone layouts could not be tested in my sandbox – please try them in Chrome/Edge and tell me what to adjust.
