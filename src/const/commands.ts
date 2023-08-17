// import { projects } from "./projects";
import { links } from "./linklist";

const commands: Map<string, string> = new Map<string, string>();

commands.set("!motd!", motdText());
commands.set("!whoami!", whoamiText());
commands.set("!touch!", touchText());

export function motdText(): string {
  return `
    <span class="terminal-title">==== Message of The Day =======</span><br />
    <br />
    &nbsp;Hi, I'm <a class="terminal-link" href="https://deeplinks.straight-line.org/" title="List of my deep links." target="_blank" rel="noreferrer">Prof. NOTA</a>!<br />
    <br />
    This <a class="terminal-link" href="#" title="Open another NOTA's console on new tab." target="_blank" rel="noreferrer">NOTA's console</a> could be a type of terminal, a window in which the text-mode programs are active, that is a physical terminal consisting of a single keyboard and monitor plugged into a dedicated serial console port on any computer device for low-level direct communication with the operating system that is directly connected to a machine.<br />
    <br />
    Type '<span class="terminal-bold" title="Shout out to me in a good way!">!prof!</span>' and hit '<span class="terminal-bold" title="Entering 0101 Universe where I belong.">enter</span>' to see all available command prompts on this <a class="terminal-link" href="#" title="Open another NOTA's console on new tab." target="_blank" rel="noreferrer">NOTA's console</a>. Have fun and enjoy it!<br />
    <br />
    &nbsp;Regards,<br />
    &nbsp;<a class="terminal-link" href="https://deeplinks.straight-line.org/" title="List of my deep links." target="_blank" rel="noreferrer">Prof. NOTA</a><br />
    <br /><br />
    <span class="terminal-title">==== 47 - <span class="terminal-bold" title="Showing message of the day from me.">!motd!</span> =======</span>
  `;
};

export function whoamiText(): string {
  return `
    <span class="terminal-title">==== Who Am I ?!?! =======</span><br />
    <br />
    &nbsp;Hi, you are a fake <span class="terminal-error" title="Root is the superuser account in Unix and Linux. It is a user account for administrative purposes, and typically has the highest access rights on the system.">root</span>!!!!<br />
    <br />
    You are using the fake superuser account, which is a fake user account for administrative purposes, and not has the highest access rights on this console.<br />
    <br />
    &nbsp;Regards,<br />
    &nbsp;<a class="terminal-link" href="https://deeplinks.straight-line.org/" title="List of my deep links." target="_blank" rel="noreferrer">Prof. NOTA</a><br />
    <br /><br />
    <span class="terminal-title">==== 47 - <span class="terminal-bold" title="The command to display the username currently logged into this console.">!whoami!</span> =======</span>
  `;
};

export function touchText(): string {
  return `
    <span class="terminal-title">==== Touch is A Standard Command =======</span><br />
    <br />
    &nbsp;Hi fake <span class="terminal-error" title="Root is the superuser account in Unix and Linux. It is a user account for administrative purposes, and typically has the highest access rights on the system.">root</span>!!!!<br />
    <br />
    What are you doing!?!? There is nothing that can be touched here. Anyway, why would you touch anything!?!?<br />
    <br />
    &nbsp;Regards,<br />
    &nbsp;<a class="terminal-link" href="https://deeplinks.straight-line.org/" title="List of my deep links." target="_blank" rel="noreferrer">Prof. NOTA</a><br />
    <br /><br />
    <span class="terminal-title">==== 47 - <span class="terminal-bold" title="Standard command used in UNIX/Linux operating system which is used to create, change and modify timestamps of a file.">!touch!</span> =======</span>
  `;
}

commands.set("!nota!", notaLogo());
export function notaLogo() {
  return `
    <span class="terminal-title">==== Prof. NOTA Signature v.1.47 =======</span><br />
    <br />
    <span class="flex flex-col">
      <span>${"*    ██     ██████  ██████   ██████  ███████        ███    ██  ██████  ████████  █████      ██".replaceAll(" ", "&nbsp;")}</span>
      <span>${"*    ██     ██   ██ ██   ██ ██    ██ ██             ████   ██ ██    ██    ██    ██   ██     ██".replaceAll(" ", "&nbsp;")}</span>
      <span>${"*    ██     ██████  ██████  ██    ██ █████          ██ ██  ██ ██    ██    ██    ███████     ██".replaceAll(" ", "&nbsp;")}</span>
      <span>${"*           ██      ██   ██ ██    ██ ██             ██  ██ ██ ██    ██    ██    ██   ██       ".replaceAll(" ", "&nbsp;")}</span>
      <span>${"*    ██     ██      ██   ██  ██████  ██      ".replaceAll(" ", "&nbsp;")}<a href="https://prompt.straight-line.org/seedphrase.txt" title="If you reach this, it means you're lucky or maybe you have a big curiosity about me." class="terminal-secret" target="_blank">██</a>${"     ██   ████  ██████     ██    ██   ██     ██".replaceAll(" ", "&nbsp;")}</span>
      <span>${"                                                                                              ".replaceAll(" ", "&nbsp;")}</span>
      <span>${"STRAIGHT-LINE.ORG by ".replaceAll(" ", "&nbsp;")}<a class="terminal-link" href="https://www.straight-line.org/" title="MyReceipt Rest in Proxy (R.I.P.)!!!!" target="_blank" rel="noreferrer">@MyReceipt</a>${"                                                               ".replaceAll(" ", "&nbsp;")}</span>
      <span>${"Deep Links: ".replaceAll(" ", "&nbsp;")}<a class="terminal-link" href="https://www.straight-line.org/" title="MyReceipt Rest in Proxy (R.I.P.)!!!!" target="_blank" rel="noreferrer">https://straight-line.org/</a>${"                                                        ".replaceAll(" ", "&nbsp;")}</span>
    </span><br />
    <br />
    <span class="terminal-title">==== Prof. NOTA Signature v.4.74 =======</span><br />
    <br />
    <span class="flex flex-col">
      <span>${"*    ##     ######  ######   ######  #######        ###    ##  ######  ########  #####      ##".replaceAll(" ", "&nbsp;")}</span>
      <span>${"*    ##     ##   ## ##   ## ##    ## ##             ####   ## ##    ##    ##    ##   ##     ##".replaceAll(" ", "&nbsp;")}</span>
      <span>${"*    ##     ######  ######  ##    ## #####          ## ##  ## ##    ##    ##    #######     ##".replaceAll(" ", "&nbsp;")}</span>
      <span>${"*           ##      ##   ## ##    ## ##             ##  ## ## ##    ##    ##    ##   ##       ".replaceAll(" ", "&nbsp;")}</span>
      <span>${"*    ##     ##      ##   ##  ######  ##      ".replaceAll(" ", "&nbsp;")}<a href="https://prompt.straight-line.org/seedphrase.txt" title="If you reach this, it means you're lucky or maybe you have a big curiosity about me." class="terminal-secret" target="_blank">##</a>${"     ##   ####  ######     ##    ##   ##     ##".replaceAll(" ", "&nbsp;")}</span>
      <span>${"                                                                                              ".replaceAll(" ", "&nbsp;")}</span>
      <span>${"STRAIGHT-LINE.ORG by ".replaceAll(" ", "&nbsp;")}<a class="terminal-link" href="https://deeplinks.straight-line.org/" title="List of my deep links." target="_blank" rel="noreferrer">Prof. NOTA</a>${" - ".replaceAll(" ", "&nbsp;")}<a class="terminal-link" href="https://www.straight-line.org/" title="MyReceipt Rest in Proxy (R.I.P.)!!!!" target="_blank" rel="noreferrer">@MyReceipt</a>${"                                                  ".replaceAll(" ", "&nbsp;")}</span>
      <span>${"Deep Links: ".replaceAll(" ", "&nbsp;")}<a class="terminal-link" href="https://deeplinks.straight-line.org/" title="List of my deep links." target="_blank" rel="noreferrer">https://deeplinks.straight-line.org/</a>${"                                              ".replaceAll(" ", "&nbsp;")}</span>
      
    </span><br />
    <br />
    <span class="terminal-title">==== 47 - <span class="terminal-bold" title="My notable signature. Find it and collect it!">!nota!</span> =======</span>
  `;
};

commands.set("!whois!", whoisText());
export function whoisText(): string {
  return `
  <span class="terminal-title">==== A Straight Line of My Origin =======</span><br />
  <br />
  &nbsp;Hi, I'm <a class="terminal-link" href="https://deeplinks.straight-line.org/" title="List of my deep links." target="_blank" rel="noreferrer">Prof. NOTA</a>!<br />
  <br />
  I'm playing, learning, and working 47% on Web3 for <a class="terminal-link" href="https://iqraa.straight-line.org/the-kings-nfts/" title="The KING's NFTs GitBook." target="_blank" rel="noreferrer">The KING's NFTs</a>, an artifact project by <a class="terminal-link" href="https://www.straight-line.org/" title="MyReceipt Rest in Proxy (R.I.P.)!!!!" target="_blank" rel="noreferrer">MyReceipt</a>. Here I will share a straight line of my origin. I hope you love reading!<br />
  <br />
  &nbsp;Happy reading!<br>
  &nbsp;<a class="terminal-link" href="https://deeplinks.straight-line.org/" title="List of my deep links." target="_blank" rel="noreferrer">Prof. NOTA</a><br />
  <br /><br />
  <span class="terminal-title">==== * So, who am I ?!?! =======</span><br />
  <br />
  I'm just a character that was born in the <span class="terminal-error" title="...digital technology and the digital world on the Internet undoubtedly become everything for everyone...">0101 Universe</span> because a person in his reality, your real life, is desperate with himself, with his reality but his mind still has a big hope with his dream in his own world. I exist in the digital realm of the Internet.<br />
  <br /><br />
  <span class="terminal-title">==== * How am I ?!?! =======</span><br />
  <br />
  My creators, in their reality, your real life, compiles any good things, advice, and ideal personas from people they met throughout their life, to become a character, called <a class="terminal-link" href="https://deeplinks.straight-line.org/" title="List of my deep links." target="_blank" rel="noreferrer">Prof. NOTA</a>. After they are really sure about me, <a class="terminal-link" href="https://www.straight-line.org/" title="MyReceipt Rest in Proxy (R.I.P.)!!!!" target="_blank" rel="noreferrer">MyReceipt</a> deploys a smart contract in the Ethereum blockchain using ERC 721 standard to mint 47 NFTs. He named that smart contract "<a class="terminal-link" href="https://iqraa.straight-line.org/the-kings-nfts/02-the-creations.../waivfves-1/32.-prof.-nota-genesis" title="GitBook of Prof. NOTA The Genesis" target="_blank" rel="noreferrer">Prof. NOTA The Genesis</a>" to mark my born in the <span class="terminal-error" title="...digital technology and the digital world on the Internet undoubtedly become everything for everyone...">0101 Universe</span>.<br />
  <br /><br />
  <span class="terminal-title">==== * Why am I ?!?! =======</span><br />
  <br />
  My creators also provides information in my metadata, it said that I'm a way of playing, learning, and working to redefine their reality, your real life, that surrounds me (<a class="terminal-link" href="https://www.straight-line.org/" title="MyReceipt Rest in Proxy (R.I.P.)!!!!" target="_blank" rel="noreferrer">MyReceipt's dream</a>), that I'm a way to always remind you all to stay alert for a society civilization that masks any scams (<a class="terminal-link" href="https://www.straight-line.org/" title="MyReceipt Rest in Proxy (R.I.P.)!!!!" target="_blank" rel="noreferrer">MyReceipt's despair</a>).<br />
  <br />
  More than that, for any wallet that holds one or more of "<a class="terminal-link" href="https://iqraa.straight-line.org/the-kings-nfts/02-the-creations.../waivfves-1/32.-prof.-nota-genesis" title="GitBook of Prof. NOTA The Genesis" target="_blank" rel="noreferrer">Prof. NOTA The Genesis</a>" NFTs, and some chosen NFTs and FTs that <a class="terminal-link" href="https://www.straight-line.org/" title="MyReceipt Rest in Proxy (R.I.P.)!!!!" target="_blank" rel="noreferrer">MyReceipt</a> created, the wallet owner can get full access to me o, and full control of my avatars, in purpose to get the best help, support, and advice from me about this <span class="terminal-error" title="...digital technology and the digital world on the Internet undoubtedly become everything for everyone...">0101 Universe</span> as long as utilize the Web3 technology.<br />
  <br /><br />
  <span class="terminal-title">==== * Want to dig deeper ?!?! =======</span><br />
  <br />
  Use the '<span class="terminal-bold" title="Some interesting links from me.">!links!</span>' command to dig deeper and to reach me anytime, and anywhere if you have any questions or feedback for me!<br />
  <br /><br />
  <span class="terminal-title">==== * So, how do you think ?!?! =======</span><br />
  <br />
  Whatever you think about me, about this <span class="terminal-error" title="...digital technology and the digital world on the Internet undoubtedly become everything for everyone...">0101 Universe</span>, Web3, blockchain, and anything in this digital realm, I will always remind you all to <span class="terminal-error" titel="Remember me, remember there is a scammer!!!!">BEWARE OF SCAMS</span>!!!!<br />
  <br />
  Really very big thanks for visiting this web! If you like, you can share this web anywhere with anyone in the Web3 ecosystem. If you want, you can customize, or even exploit this web as you need. If you can, always educate and keep our community safe.<br />
  <br />
  I'm doesn't belong in your reality, your real life. In your reality, in your real life, you just can meet my avatars in any version. So, once again, <span class="terminal-error" titel="Remember me, remember there is a scammer!!!!">BEWARE OF SCAMS</span>!!!!<br />
  <br /><br />
  <span class="terminal-title">==== 47 - <span class="terminal-bold" title="Here I will share a straight line of my origin.">!whois!</span> =======</span>
  `;
};

commands.set("!links!", linksText());
function linksText(): string {
  return `
    <span class="terminal-title">==== Interesting Links List =======</span><br />
    <br />
    Here is a list of some interesting links for you. Please hover on each link to read more information about the link.<br />
    <br />
    ${links
      .map((link) => {
        return `
          &nbsp;&#8226;
          <a 
          class="project-${link.category}"
          href="${link.link}"
          title="${link.title}"
          target="_blank"
          rel="noreferrer"
        >${link.name}</a>`;
      })
      .join("<br />")}
    <br /><br />
    Ps, I will not provide any other links other than the links above and the external links that I include on the web pages at the links above. So, please always double-check the link URL you are visiting. okay!!!!<br />
    <br /><br />
    <span class="terminal-title">==== 47 - <span class="terminal-bold" title="Some interesting links from me.">!links!</span> =======</span>
  `;
};


commands.set("!prof!", profText());

export const getCommandByName = (name: string): string => {
  name = name.trim().toLowerCase().split(" ")[0];

  // commands that require redirecting
  switch (name) {
    case "!github!":
      window.open("https://github.com/0l1v3rr", "_blank");
      break;
    case "!repo!":
      window.open("https://github.com/0l1v3rr/0l1v3rr.github.io", "_blank");
      break;
    case "!email!":
      window.open("mailto:oliver.mrakovics@gmail.com", "_blank");
      break;
    case "!codersrank!":
      window.open("https://profile.codersrank.io/user/0l1v3rr/", "_blank");
      break;
    case "!cat!":
      window.open("https://cataas.com/cat/cute", "_blank");
      break;
  }

  return commands.get(name) || `${name}: command not found`;
};

function profText(): string {
  const commandNames: string[] = ["!clear!", "!prof!"];
  for (const entry of Array.from(commands.entries())) {
    commandNames.push(entry[0]);
  }
  return `
    <span class="terminal-title">==== All Command Prompts =======</span><br />
    <br />
    Usage: [<span class="terminal-bold" title="Command prompts that you want to use.">command</span>] [<span class="terminal-bold" title="There is no options for all command prompts.">no-options</span>]<br />
    <br />
    ${commandNames
      .sort()
      .join("<br />")}
    <br /><br /><br />
    <span class="terminal-title">==== 47 - <span class="terminal-bold" title="Shout out to me in a good way!">!prof!</span> =======</span>
  `;
};

export const getCommandNames = (): string[] => {
  const commandNames: string[] = ["!clear!"];
  for (const entry of Array.from(commands.entries())) {
    commandNames.push(entry[0]);
  }
  return commandNames.sort();
};



// commands.set("!rm!", "There is nothing that can be removed here. Anyway, why would you remove anything?");
// commands.set("!banana!", openBananowLand());
// commands.set("!pwd!", "/");
// commands.set("!date!", new Date().toLocaleString());
// commands.set("!ls!", linksText());
// commands.set("!github!", openLink("https://github.com/0l1v3rr"));
// commands.set("!repo!", openLink("https://github.com/0l1v3rr/0l1v3rr.github.io"));
// commands.set("!email!", openLink("mailto:oliver.mrakovics@gmail.com"));
// commands.set(
//   "!codersrank!",
//   openLink("https://profile.codersrank.io/user/0l1v3rr/")
// );
// commands.set(
//   "!socials!",
//   "Usage: [command]<br /><br />!github!, !email!, !codersrank!"
// );
// commands.set("!techstack!", techStack());

// function openLink(link: string): string {
//   return `
//     Redirecting to 
//       <a class="terminal-link" href="${link}" target="_blank" rel="noreferrer">
//         ${link}</a>...
//     `;
// }

// function openBananowLand(link: string): string {
//   return `
//     <span class="terminal-title">==== Let's Go Banana Now! =======</span><br />
//     <br />
//     Redirecting to <a class="terminal-link" href="https://bananow.land/" target="_blank" rel="noreferrer">BANANOW.LAND</a> where a healthy fruit available just for you! 😊
//   `;
// }

// function techStack() {
//   return `<a href="https://github.com/0l1v3rr/github-readme-tech-stack" target="_blank"><img src="https://github-readme-tech-stack.vercel.app/api/cards?title=Tech%20Stack&align=center&titleAlign=center&fontSize=20&lineCount=2&theme=0l1v3rr&line1=laravel,laravel,auto;go,golang,00add8;docker,docker,auto;&line2=react,react,2d79c7;tailwindcss,tailwind,38bdf8;typescript,typescript,2d79c7;&width=420" alt="My Tech Stack" /></a>`;
// }
