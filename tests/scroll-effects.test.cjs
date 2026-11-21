'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
// TypeScript 7 has a native compiler but no JS compiler API; keep legacy test harness on TS6.
const ts = require('@typescript/typescript6');

const root = path.join(__dirname, '..');

// Transpile the repository's actual TS/TSX source without mounting a browser.
// Inject a tiny React hook harness so a Chrome 150+ Promise return is testable.
function loadSource(relativePath, imports) {
  const sourcePath = path.join(root, relativePath);
  const source = fs.readFileSync(sourcePath, 'utf8');
  const js = ts.transpileModule(source, {
    fileName: sourcePath,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const mod = { exports: {} };
  const wrapper = vm.runInThisContext(
    '(function (require, module, exports) {\n' + js + '\n})',
    { filename: sourcePath, timeout: 1000 },
  );
  wrapper((id) => {
    if (Object.hasOwn(imports, id)) return imports[id];
    throw new Error('Unmocked import ' + id + ' in ' + relativePath);
  }, mod, mod.exports);
  return mod.exports;
}

for (const returnKind of ['Promise (Chrome 150+)', 'undefined (legacy browsers)']) {
  const scrollResult = returnKind.startsWith('Promise') ? Promise.resolve() : undefined;

  test('useScrollToBottom effect stays void when scrolling returns ' + returnKind, () => {
    const effects = [];
    const calls = [];
    const react = {
      useEffect(fn) { effects.push(fn); },
    };
    const { useScrollToBottom } = loadSource('src/hooks/useScrollToBottom.ts', {
      react,
    });
    const element = {
      scrollIntoView(options) {
        calls.push(options);
        return scrollResult;
      },
    };
    useScrollToBottom(element);
    assert.equal(effects.length, 1);
    assert.equal(effects[0](), undefined, 'React effect must return void, not a scroll Promise');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].behavior, 'smooth');
  });

  test('TerminalContainer effect stays void when scrolling returns ' + returnKind, () => {
    const effects = [];
    const calls = [];
    const element = {
      scrollIntoView(options) {
        calls.push(options);
        return scrollResult;
      },
    };
    const react = {
      useRef() { return { current: element }; },
      useState(initial) { return [initial, () => {}]; },
      useEffect(fn) { effects.push(fn); },
    };
    class PromptSession {
      constructor() {
        this.promptText = '';
        this.showCursor = true;
        this.enterPressed = false;
      }
    }
    const { default: TerminalContainer } = loadSource(
      'src/components/terminal/TerminalContainer.tsx',
      {
        react,
        'react/jsx-runtime': { jsx() { return null; }, jsxs() { return null; } },
        '../../hooks/useKeyboardInput': { useKeyboardInput() { return 'x'; } },
        '../../hooks/useScrollToBottom': { useScrollToBottom() {} },
        '../../hooks/useIsMobile': { useIsMobile() { return false; } },
        '../../classes/prompt-session': PromptSession,
        '../../const/commands': { motdText() { return 'Message of the day'; } },
        './Prompt': { default() {} },
        './TerminalTitle': { default() {} },
        './ResultDiv': { default() {} },
      },
    );
    TerminalContainer();
    assert.equal(effects.length, 1);
    assert.equal(effects[0](), undefined, 'React effect must return void, not a scroll Promise');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].behavior, 'smooth');
  });
}
