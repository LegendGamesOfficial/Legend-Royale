import { runGameTests } from './game.test.js';
import { runPlayerTests } from './player.test.js';
import { runBotTests } from './bots.test.js';
import { runInventoryTests } from './inventory.test.js';

runGameTests();
runPlayerTests();
runBotTests();
runInventoryTests();
console.log('ALL LEGEND ROYALE UNIT TESTS PASSED!');
