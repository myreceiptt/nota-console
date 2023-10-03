// import { projects } from "./projects";
import { links } from "./linklist";
import { profs } from "./proflist";

const commands: Map<string, string> = new Map<string, string>();

commands.set("!banana!", bananaText());
function bananaText(): string {
  return `
    <span class="terminal-title">==== Let's Go Banana Now! =======</span><br />
    <br />
    &nbsp;Hi, I'm <a class="terminal-link" href="https://deeplinks.straight-line.org/" title="List of my deep links." target="_blank" rel="noreferrer">Prof. NOTA</a>!<br />
    <br />
    I'm redirecting you to <a class="terminal-link" href="https://bananow.land" title="Let's go banana now, OiOi!!!!" target="_blank" rel="noreferrer">BANANOW.LAND</a> where a healthy fruit available just for you! Let's go banana now! 😊<br />
    <br />
    &nbsp;Regards,<br />
    &nbsp;<a class="terminal-link" href="https://deeplinks.straight-line.org/" title="List of my deep links." target="_blank" rel="noreferrer">Prof. NOTA</a><br />
    <br /><br />
    <span class="terminal-title">==== 47 - <span class="terminal-bold" title="A healthy fruit just for you!">!banana!</span> =======</span>
  `;
};

export const getCommandNames = (): string[] => {
  const commandNames: string[] = ["!clear!"];
  for (const entry of Array.from(commands.entries())) {
    commandNames.push(entry[0]);
  };
  return commandNames.sort();
};

// commands.set("!date!", new Date().toLocaleString());

commands.set("!help!", helpText());
function helpText(): string {
  return`
    <span class="terminal-title">==== The '!HELP!' Command =======</span><br />
    <br />
    &nbsp;Hi fake <span class="terminal-error" title="Root is the superuser account in Unix and Linux. It is a user account for administrative purposes, and typically has the highest access rights on the system.">root</span>!!!!<br />
    <br />
    Are you kidding me? Did you already read the message of the day from me? Oh, come on!!!!<br />
    <br />
    &nbsp;Regards,<br />
    &nbsp;<a class="terminal-link" href="https://deeplinks.straight-line.org/" title="List of my deep links." target="_blank" rel="noreferrer">Prof. NOTA</a><br />
    <br /><br />
    <span class="terminal-title">==== 47 - <span class="terminal-bold" title="The '!help!' command provides information on any command prompts bundled with a console. But, here you should use the '!prof!' command to see all available command prompts.">!help!</span> =======</span>
  `;
};

commands.set("!links!", linksText());
function linksText(): string {
  return `
    <span class="terminal-title">==== Interesting Links List =======</span><br />
    <br />
    &nbsp;Hi, I'm <a class="terminal-link" href="https://deeplinks.straight-line.org/" title="List of my deep links." target="_blank" rel="noreferrer">Prof. NOTA</a>!<br />
    <br />
    Here is a list of some interesting links for you. Please hover over each link to read more information about the link.<br />
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
    Note it, I will not provide any other links other than the links above and the external links that I include on the web pages at the links above. So, please always double-check the link URL you are visiting. okay!!!!<br />
    <br />
    &nbsp;Regards,<br>
    &nbsp;<a class="terminal-link" href="https://deeplinks.straight-line.org/" title="List of my deep links." target="_blank" rel="noreferrer">Prof. NOTA</a><br />
    <br /><br />
    <span class="terminal-title">==== 47 - <span class="terminal-bold" title="Some interesting links from me.">!links!</span> =======</span>
  `;
};

commands.set("!motd!", motdText());
export function motdText(): string {
  return `
    <span class="terminal-title">==== Message of The Day !!!! =======</span><br />
    <br />
    &nbsp;Hi, I'm <a class="terminal-link" href="https://deeplinks.straight-line.org/" title="List of my deep links." target="_blank" rel="noreferrer">Prof. NOTA</a>!<br />
    <br />
    This <a class="terminal-link" href="#" title="Open another NOTA's console on new tab." target="_blank" rel="noreferrer">NOTA's console</a> could be a type of terminal, a window in which the text-mode programs are active, that is a physical terminal consisting of a single keyboard and monitor plugged into a dedicated serial console port on any computer device for low-level direct communication with the operating system that is directly connected to a machine.<br />
    <br />
    Type '<span class="terminal-bold" title="Shout out to me in a good way!">!prof!</span>' and hit '<span class="terminal-bold" title="Entering 0101 Universe where I belong.">enter</span>' to see all available command prompts on this <a class="terminal-link" href="#" title="Open another NOTA's console on a new tab." target="_blank" rel="noreferrer">NOTA's console</a>. Have fun and enjoy it!<br />
    <br />
    &nbsp;Regards,<br />
    &nbsp;<a class="terminal-link" href="https://deeplinks.straight-line.org/" title="List of my deep links." target="_blank" rel="noreferrer">Prof. NOTA</a><br />
    <br /><br />
    <span class="terminal-title">==== 47 - <span class="terminal-bold" title="Showing message of the day from me.">!motd!</span> =======</span>
  `;
};

commands.set("!nota!", notaLogo());
function notaLogo() {
  return `
    <span class="terminal-title">==== My NOTAble Signatures =======</span><br />
    <br />
    &nbsp;Hi, I'm <a class="terminal-link" href="https://deeplinks.straight-line.org/" title="List of my deep links." target="_blank" rel="noreferrer">Prof. NOTA</a>!<br />
    <br />
    My signature is not an autograph that is specially handwritten by me. My signature not for a fan to keep. My signature is a sign for us all to keep playing, learning, and working together to keep our community safe.<br />
    <br />
    &nbsp;My Signature v.1.47<br />
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
    &nbsp;My Signature v.4.74<br />
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
    &nbsp;Regards,<br />
    &nbsp;<a class="terminal-link" href="https://deeplinks.straight-line.org/" title="List of my deep links." target="_blank" rel="noreferrer">Prof. NOTA</a><br />
    <br /><br />
    <span class="terminal-title">==== 47 - <span class="terminal-bold" title="My notable signature. Find it and collect it!">!nota!</span> =======</span>
  `;
};

commands.set("!oioi!", oioiText());
function oioiText(): string {
  return `
    <span class="terminal-title">==== ALL $HAIL ENDHONESA !!!! =======</span><br />
    <br />
    &nbsp;Hi, I'm <a class="terminal-link" href="https://deeplinks.straight-line.org/" title="List of my deep links." target="_blank" rel="noreferrer">Prof. NOTA</a>!<br />
    <br />
    I'm redirecting you to <a class="terminal-link" href="https://endhonesa.com" title="ALL $HAIL ENDHONESA, #OiOi!!!!" target="_blank" rel="noreferrer">ENDHONESA.COM</a> where its residents, that is <span class="terminal-error" title="'OiOi' is a nickname for the residents of ENDHONESA. 'OiOi' are all the holders of any NFTs and FTs part of The KING's NFTs project. 'OiOi' is also used as a word of greeting among fellow residents of ENDHONESA.">OiOi Community</span>, trade according to their own resulting revenue and formed value. Our trading life will be free since we are anonymous. We will be a legion if we do not forgive and we do not forget. But, please don’t expect me! Expect us!!!!<br />
    <br />
    &nbsp;Regards,<br />
    &nbsp;<a class="terminal-link" href="https://deeplinks.straight-line.org/" title="List of my deep links." target="_blank" rel="noreferrer">Prof. NOTA</a><br />
    <br /><br />
    <span class="terminal-title">==== 47 - <span class="terminal-bold" title="'OiOi' is a nickname for the residents of ENDHONESA. 'OiOi' are all the holders of any NFTs and FTs part of The KING's NFTs project. 'OiOi' is also used as a word of greeting among fellow residents of ENDHONESA.">!oioi!</span> =======</span>
  `;
};

commands.set("!pwd!", pwdText());
function pwdText(): string {
  return `
    <span class="terminal-title">==== Print Working Directory !!!! =======</span><br />
    <br />
    &nbsp;Hi fake <span class="terminal-error" title="Root is the superuser account in Unix and Linux. It is a user account for administrative purposes, and typically has the highest access rights on the system.">root</span>!!!!<br />
    <br />
    Since this <a class="terminal-link" href="#" title="Open another NOTA's console on a new tab." target="_blank" rel="noreferrer">NOTA's console</a> is a web console, so the working directory depends on the tech-stack and how I setup the server. It could be any of the following:<br />
    <br />
    &nbsp;* <span class="terminal-error" title="The working directory is 'root@nota' in 'home' directory.">/home/root@nota/</span><br />
    &nbsp;* <span class="terminal-error" title="The working directory is 'local' in 'usr' directory.">/usr/local/</span><br />
    &nbsp;* <span class="terminal-error" title="The working directory is 'share' in 'usr' directory.">/usr/share/</span><br />
    &nbsp;* <span class="terminal-error" title="The working directory is 'http' in 'srv' directory.">/srv/http/</span><br />
    &nbsp;* <span class="terminal-error" title="The working directory is 'http' in 'www' directory under 'srv' directory.">/srv/www/http/</span><br />
    &nbsp;* <span class="terminal-error" title="The working directory is 'html' in 'www' directory under 'var' directory.">/var/www/html/</span><br />
    <br />
    Now, I will let you guess it for our fun.<br />
    <br />
    &nbsp;Regards,<br />
    &nbsp;<a class="terminal-link" href="https://deeplinks.straight-line.org/" title="List of my deep links." target="_blank" rel="noreferrer">Prof. NOTA</a><br />
    <br /><br />
    <span class="terminal-title">==== 47 - <span class="terminal-bold" title="The 'pwd' stands for 'Print Working Directory'. It prints the path of the working directory, starting from the root (/).">!pwd!</span> =======</span>
  `;
};

commands.set("!rm!", rmText());
function rmText(): string {
  return `
    <span class="terminal-title">==== The '!RM!' Command =======</span><br />
    <br />
    &nbsp;Hi fake <span class="terminal-error" title="Root is the superuser account in Unix and Linux. It is a user account for administrative purposes, and typically has the highest access rights on the system.">root</span>!!!!<br />
    <br />
    What are you doing!?!? There is nothing that can be removed here. Anyway, why would you remove anything!?!?<br />
    <br />
    &nbsp;Regards,<br />
    &nbsp;<a class="terminal-link" href="https://deeplinks.straight-line.org/" title="List of my deep links." target="_blank" rel="noreferrer">Prof. NOTA</a><br />
    <br /><br />
    <span class="terminal-title">==== 47 - <span class="terminal-bold" title="The 'rm' command stands for 'remove here'. It is used to remove objects such as files, directories, symbolic links, and so on from the file system.">!rm!</span> =======</span>
  `;
};

commands.set("!shredd!", shreddText());
function shreddText(): string {
  return `
    <span class="terminal-title">==== Let's Go Shredding !!!! =======</span><br />
    <br />
    &nbsp;Hi, I'm <a class="terminal-link" href="https://deeplinks.straight-line.org/" title="List of my deep links." target="_blank" rel="noreferrer">Prof. NOTA</a>!<br />
    <br />
    I'm redirecting you to <a class="terminal-link" href="https://skateshop.id" title="ALL $HAIL SKATEBOARDING, #OiOi!!!!" target="_blank" rel="noreferrer">SKATESHOP.ID</a> where all the best skateboarding goods from my world are provided just for you. Since your reality, your real life is too awesome to be forgotten, go grab your skateboard, and let's shred it!!!!<br />
    <br />
    &nbsp;Regards,<br />
    &nbsp;<a class="terminal-link" href="https://deeplinks.straight-line.org/" title="List of my deep links." target="_blank" rel="noreferrer">Prof. NOTA</a><br />
    <br /><br />
    <span class="terminal-title">==== 47 - <span class="terminal-bold" title="Shredding can be defined in the skateboarding world as riding with exceptional ability, style, speed, or enthusiasm.">!shredd!</span> =======</span>
  `;
};

commands.set("!touch!", touchText());
function touchText(): string {
  return `
    <span class="terminal-title">==== '!TOUCH!' is A Standard Command =======</span><br />
    <br />
    &nbsp;Hi fake <span class="terminal-error" title="Root is the superuser account in Unix and Linux. It is a user account for administrative purposes, and typically has the highest access rights on the system.">root</span>!!!!<br />
    <br />
    What are you doing!?!? There is nothing that can be touched here. Anyway, why would you touch anything!?!?<br />
    <br />
    &nbsp;Regards,<br />
    &nbsp;<a class="terminal-link" href="https://deeplinks.straight-line.org/" title="List of my deep links." target="_blank" rel="noreferrer">Prof. NOTA</a><br />
    <br /><br />
    <span class="terminal-title">==== 47 - <span class="terminal-bold" title="The 'touch' is a standard command used in UNIX/Linux operating system which is used to create, change and modify timestamps of a file.">!touch!</span> =======</span>
  `;
};

commands.set("!whoami!", whoamiText());
function whoamiText(): string {
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

commands.set("!whois!", whoisText());
function whoisText(): string {
  return `
  <span class="terminal-title">==== A Straight Line of My Origin =======</span><br />
  <br />
  &nbsp;Hi, I'm <a class="terminal-link" href="https://deeplinks.straight-line.org/" title="List of my deep links." target="_blank" rel="noreferrer">Prof. NOTA</a>!<br />
  <br />
  I'm playing, learning, and working 47% on Web3 for <a class="terminal-link" href="https://iqraa.straight-line.org/the-kings-nfts/" title="The KING's NFTs GitBook." target="_blank" rel="noreferrer">The KING's NFTs</a>, an artifact project by <a class="terminal-link" href="https://www.straight-line.org/" title="MyReceipt Rest in Proxy (R.I.P.)!!!!" target="_blank" rel="noreferrer">MyReceipt</a>. Here I will share a straight line of my origin. I hope you love reading!<br />
  <br /><br />
  &nbsp;So, who am I...<br />
  <br />
  I'm just a character that was born in the <span class="terminal-error" title="...digital technology and the digital world on the Internet undoubtedly become everything for everyone...">0101 Universe</span> because a person in his reality, your real life, is desperate with himself, with his reality but his mind still has a big hope with his dream in his own world. I exist in the digital realm of the Internet.<br />
  <br /><br />
  &nbsp;How am I...<br />
  <br />
  My creators, in their reality, your real life, compile any good things, advice, and ideal personas from people they met throughout their life, to become a character, called <a class="terminal-link" href="https://deeplinks.straight-line.org/" title="List of my deep links." target="_blank" rel="noreferrer">Prof. NOTA</a>. After they are really sure about me, <a class="terminal-link" href="https://www.straight-line.org/" title="MyReceipt Rest in Proxy (R.I.P.)!!!!" target="_blank" rel="noreferrer">MyReceipt</a> deploys a smart contract in the Ethereum blockchain using ERC 721 standard to mint 47 NFTs. He named that smart contract "<a class="terminal-link" href="https://iqraa.straight-line.org/the-kings-nfts/02-the-creations.../waivfves-1/32.-prof.-nota-genesis" title="GitBook of Prof. NOTA The Genesis" target="_blank" rel="noreferrer">Prof. NOTA The Genesis</a>" to mark my born in the <span class="terminal-error" title="...digital technology and the digital world on the Internet undoubtedly become everything for everyone...">0101 Universe</span>.<br />
  <br /><br />
  &nbsp;Why am I...<br />
  <br />
  My creators also provide information in my metadata, it said that I'm a way of playing, learning, and working to redefine their reality, your real life, that surrounds me (<a class="terminal-link" href="https://www.straight-line.org/" title="MyReceipt Rest in Proxy (R.I.P.)!!!!" target="_blank" rel="noreferrer">MyReceipt's dream</a>), that I'm a way to always remind you all to stay alert for a society civilization that masks any scams (<a class="terminal-link" href="https://www.straight-line.org/" title="MyReceipt Rest in Proxy (R.I.P.)!!!!" target="_blank" rel="noreferrer">MyReceipt's despair</a>).<br />
  <br />
  More than that, for any wallet that holds one or more of "<a class="terminal-link" href="https://iqraa.straight-line.org/the-kings-nfts/02-the-creations.../waivfves-1/32.-prof.-nota-genesis" title="GitBook of Prof. NOTA The Genesis" target="_blank" rel="noreferrer">Prof. NOTA The Genesis</a>" NFTs, and some chosen NFTs and FTs that <a class="terminal-link" href="https://www.straight-line.org/" title="MyReceipt Rest in Proxy (R.I.P.)!!!!" target="_blank" rel="noreferrer">MyReceipt</a> created, the wallet owner can get full access to me (online), and full control of my avatars (offline in your reality, your real life), in purpose to get the best help, support, and advice from me about this <span class="terminal-error" title="...digital technology and the digital world on the Internet undoubtedly become everything for everyone...">0101 Universe</span> as long as utilize the Web3 technology.<br />
  <br /><br />
  &nbsp;Want to dig deeper...<br />
  <br />
  Use the '<span class="terminal-bold" title="Some interesting links from me.">!links!</span>' command to dig deeper and to reach me anytime, and anywhere if you have any questions or feedback for me!<br />
  <br /><br />
  &nbsp;So, how do you think...<br />
  <br />
  Whatever you think about me, about this <span class="terminal-error" title="...digital technology and the digital world on the Internet undoubtedly become everything for everyone...">0101 Universe</span>, Web3, blockchain, and anything in this digital realm, I will always remind you all to <span class="terminal-error" title="Remember me, remember there is a scammer!!!!">BEWARE OF SCAMS</span>!!!!<br />
  <br />
  Really very big thanks for using this web console! If you like, you can share this web console anywhere with anyone in the Web3 ecosystem. If you want, you can customize, or even exploit this web console as you need. If you can, always educate and keep our community safe.<br />
  <br />
  I'm doesn't belong in your reality, your real life. In your reality, in your real life, you just can meet my avatars in any version. So, once again, <span class="terminal-error" title="Remember me, remember there is a scammer!!!!">BEWARE OF SCAMS</span>!!!!<br />
  <br />
  &nbsp;Regards,<br>
  &nbsp;<a class="terminal-link" href="https://deeplinks.straight-line.org/" title="List of my deep links." target="_blank" rel="noreferrer">Prof. NOTA</a><br />
  <br /><br />
  <span class="terminal-title">==== 47 - <span class="terminal-bold" title="Here I will share a straight line of my origin.">!whois!</span> =======</span>
  `;
};

commands.set("!prof!", profText());
function profText(): string {
  return `
    <span class="terminal-title">==== All Command Prompts =======</span><br />
    <br />
    &nbsp;Hi, fake <span class="terminal-error" title="Root is the superuser account in Unix and Linux. It is a user account for administrative purposes, and typically has the highest access rights on the system.">root</span>!!!!<br />
    <br />
    Here is the list of all available command prompts on this <a class="terminal-link" href="#" title="Open another NOTA's console on a new tab." target="_blank" rel="noreferrer">NOTA's console</a>. Please read the usage below and hover over each command, maybe there is more information about the command that you can read.<br />
    <br />
    &nbsp;Usage: [<span class="terminal-bold" title="Command prompts that you want to use.">command</span>] [<span class="terminal-bold" title="There are no options for all command prompts.">no-options</span>]<br />
    <br >
    ${profs
      .map((prof) => {
        return `
          &nbsp;&#8226;
          <span 
          class="terminal-bold"
          title="${prof.title}"
        >${prof.name}</span>`;
      })
      .join("<br />")}
    <br /><br />
    If you have any other command prompts that you want to use, you can try and maybe you will find it useful here.<br />
    <br />
    &nbsp;Regards,<br>
    &nbsp;<a class="terminal-link" href="https://deeplinks.straight-line.org/" title="List of my deep links." target="_blank" rel="noreferrer">Prof. NOTA</a><br />
    <br /><br />
    <span class="terminal-title">==== 47 - <span class="terminal-bold" title="Shout out to me in a good way!">!prof!</span> =======</span>
  `;
};
// function profText(): string {
//   const commandNames: string[] = ["!clear!", "!prof!"];
//   for (const entry of Array.from(commands.entries())) {
//     commandNames.push(entry[0]);
//   };
//   return `
//     <span class="terminal-title">==== All Command Prompts =======</span><br />
//     <br />
//     &nbsp;Hi, fake <span class="terminal-error" title="Root is the superuser account in Unix and Linux. It is a user account for administrative purposes, and typically has the highest access rights on the system.">root</span>!!!!<br />
//     <br />
//     Here is the list of all available command prompts on this <a class="terminal-link" href="#" title="Open another NOTA's console on new tab." target="_blank" rel="noreferrer">NOTA's console</a>. Please read the usage below and hover over each command, maybe there is more information about the command that you can read.<br />
//     <br />
//     &nbsp;Usage: [<span class="terminal-bold" title="Command prompts that you want to use.">command</span>] [<span class="terminal-bold" title="There is no options for all command prompts.">no-options</span>]<br />
//     <br />
//     &nbsp;${commandNames.sort().join("<br />&nbsp;")}
//     <br /><br /><br />
//     <span class="terminal-title">==== 47 - <span class="terminal-bold" title="Shout out to me in a good way!">!prof!</span> =======</span>
//   `;
// };

commands.set("!ls!", lsText());
function lsText(): string {
  return `
    <span class="terminal-title">==== Lists Directory Contents =======</span><br />
    <br />
    &nbsp;Hi, clever fake <span class="terminal-error" title="Root is the superuser account in Unix and Linux. It is a user account for administrative purposes, and typically has the highest access rights on the system.">root</span>!!!!<br />
    <br />
    You are in the '<span class="terminal-error" title="The working directory is 'root@nota' in 'home' directory.">/home/root@nota/</span>' directory. Below is the list of what is inside the directory:<br />
    <br />
    &nbsp;<a class="terminal-link" href="/asset-manifest.json" target="_blank">asset-manifest.json</a><br />
    &nbsp;<a class="terminal-link" href="/index.html" target="_blank">index.html</a><br />
    &nbsp;<a class="terminal-link" href="/prof-nota-v.1.20.jpg" target="_blank">prof-nota-v.1.20.jpg</a><br />
    &nbsp;<a class="terminal-link" href="/prof-nota-v.1.47.png" target="_blank">prof-nota-v.1.47.png</a><br />
    &nbsp;<a class="terminal-link" href="/revealed-resume.pdf" target="_blank">revealed-resume.pdf</a><br />
    &nbsp;<a class="terminal-link" href="/robots.txt" target="_blank">robots.txt</a><br />
    &nbsp;<a class="terminal-link" href="/seedphrase.txt" target="_blank">seedphrase.txt</a><br />
    <br />

  `;
};

export const getCommandByName = (name: string): string => {
  name = name.trim().toLowerCase().split(" ")[0];
  switch (name) {
    case "!banana!":
      window.open("https://bananow.land/", "_blank");
      break;
    case "!nano!seedphrase.txt!":
      window.open("https://prompt.straight-line.org/seedphrase.txt", "_blank");
      break;
    case "!oioi!":
      window.open("https://endhonesa.com/", "_blank");
      break;
    case "!shredd!":
      window.open("https://skateshop.id", "_blank");
      break;
  };
  return commands.get(name) || `
    <span class="terminal-title">==== Error 74 Error =======</span><br />
    <br />
    <span class="terminal-error" title="Please read the hint below for more information.">${name}: command not found</span><br />
    <br />
    Hint: Since this <a class="terminal-link" href="#" title="Open another NOTA's console on a new tab." target="_blank" rel="noreferrer">NOTA's console</a> work as a simulation with many limitation, please type '<span class="terminal-bold" title="Shout out to me in a good way!">!prof!</span>' and hit '<span class="terminal-bold" title="Entering 0101 Universe where I belong.">enter</span>' to see all available command prompts on this <a class="terminal-link" href="#" title="Open another NOTA's console on a new tab." target="_blank" rel="noreferrer">NOTA's console</a>.<br />
    <br /><br />
    <span class="terminal-title">==== Error 74 Error =======</span><br />
  `;
};

// function openLink(link: string): string {
//   return `
//     Redirecting to 
//       <a class="terminal-link" href="${link}" target="_blank" rel="noreferrer">
//         ${link}</a>...
//     `;
// }
