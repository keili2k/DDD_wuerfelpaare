let lastValues = [];
let lastSplits5unique = [];

function createDice(id) {
  const dice = document.getElementById(id);
  const faces = ['front','back','right','left','top','bottom'];
  const pipsMap = {
    1: [['p1']],
    2: [['p2'], ['p3']],
    3: [['p2'], ['p1'], ['p3']],
    4: [['p2'], ['p4'], ['p5'], ['p3']],
    5: [['p2'], ['p4'], ['p1'], ['p5'], ['p3']],
    6: [['p2'], ['p4'], ['p5'], ['p3'], ['p6'], ['p7']]
  };

  for (let i = 0; i < 6; i++) {
    const value = i + 1;
    const div = document.createElement('div');
    div.className = "face " + faces[i];

    pipsMap[value].forEach(clsArr => {
      const pip = document.createElement('div');
      pip.className = 'pip ' + clsArr.join(' ');
      div.appendChild(pip);
    });

    dice.appendChild(div);
  }
  dice.style.transform = "rotateX(0deg) rotateY(0deg) rotateZ(0deg)";
}
['d1','d2','d3','d4','dice5'].forEach(createDice);

function orientationForFrontValue(v) {
  switch (v) {
    case 1: return { x: 0,   y: 0,   z: 0   };
    case 2: return { x: 0,   y: 180, z: 0   };
    case 3: return { x: 0,   y: -90, z: 0   };
    case 4: return { x: 0,   y: 90,  z: 0   };
    case 5: return { x: -90, y: 0,   z: 0   };
    case 6: return { x: 90,  y: 0,   z: 0   };
    default: return { x: 0, y: 0, z: 0 };
  }
}
function extraSpins() {
  const r = () => 360 * Math.floor(Math.random() * 3);
  return { x: r(), y: r(), z: r() };
}
function animateDiceToValue(id, value) {
  const el = document.getElementById(id);
  const base = orientationForFrontValue(value);
  const add  = extraSpins();
  el.style.transform = `rotateX(${base.x + add.x}deg) rotateY(${base.y + add.y}deg) rotateZ(${base.z + add.z}deg)`;
}

function rollValues(n) {
  return Array.from({length: n}, () => 1 + Math.floor(Math.random()*6));
}

function getSplits(arr) {
  const n = arr.length, out = [], seen = new Set();
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = 0; k < n; k++) {
        if (k === i || k === j) continue;
        for (let l = k + 1; l < n; l++) {
          if (l === i || l === j) continue;
          const pair1 = [arr[i], arr[j]], pair2 = [arr[k], arr[l]];
          const p1k = [...pair1].sort((a,b)=>a-b).join('-');
          const p2k = [...pair2].sort((a,b)=>a-b).join('-');
          const key = [p1k, p2k].sort().join('|');
          if (!seen.has(key)) {
            seen.add(key);
            out.push({ pair1, pair2, key, idx: { pair1:[i,j], pair2:[k,l] } });
          }
        }
      }
    }
  }
  return out;
}

function formatSplits(splits) {
  splits.sort((a, b) => {
    const minA = Math.min(a.pair1[0] + a.pair1[1], a.pair2[0] + a.pair2[1]);
    const minB = Math.min(b.pair1[0] + b.pair1[1], b.pair2[0] + b.pair2[1]);
    return minA - minB;
  });

  let text = '';
  splits.forEach(s => {
    let sum1 = s.pair1[0] + s.pair1[1];
    let sum2 = s.pair2[0] + s.pair2[1];

    let leftPair = s.pair1, rightPair = s.pair2;
    if (sum1 > sum2) {
      [leftPair, rightPair] = [rightPair, leftPair];
      [sum1, sum2] = [sum2, sum1];
    }

    const isFifth = idx => idx === 4;
    const renderPair = (pair, idxs) =>
      renderMiniDice(pair[0], isFifth(idxs[0])) + renderMiniDice(pair[1], isFifth(idxs[1]));

    const pair1HTML = renderPair(leftPair, s.idx.pair1);
    const pair2HTML = renderPair(rightPair, s.idx.pair2);

    text += `${pair1HTML} & ${pair2HTML}: ${sum1}, ${sum2}<br>`;
  });

  return text;
}

function renderMiniDice(value, isFifth = false) {
  const pipsMap = {
    1: [['p1']],
    2: [['p2'], ['p3']],
    3: [['p2'], ['p1'], ['p3']],
    4: [['p2'], ['p4'], ['p5'], ['p3']],
    5: [['p2'], ['p4'], ['p1'], ['p5'], ['p3']],
    6: [['p2'], ['p4'], ['p5'], ['p3'], ['p6'], ['p7']]
  };

  const pipHTML = pipsMap[value].map(clsArr =>
    `<div class="pip ${clsArr.join(' ')}"></div>`).join('');

  return `<div class="mini-dice${isFifth ? ' is-fifth' : ''}">${pipHTML}</div>`;
}

function rollAndCalc() {
  const values = rollValues(5);
  lastValues = values;

  ['d1','d2','d3','d4','dice5'].forEach((id, idx) => animateDiceToValue(id, values[idx]));

  document.getElementById("values").textContent = "Ergebnisse: " + values.join(", ");

  const arr4 = values.slice(0,4);
  const arr5 = values.slice();
  const splits4 = getSplits(arr4);
  const set4    = new Set(splits4.map(s => s.key));
  const splits5all = getSplits(arr5);

  lastSplits5unique = splits5all.filter(s => {
    const uses5 = s.idx.pair1.includes(4) || s.idx.pair2.includes(4);
    return uses5 && !set4.has(s.key);
  });

  document.getElementById("list1").innerHTML =
    "<b>Liste 1 (nur Würfel 1–4):</b>\n" + formatSplits(splits4);

  updateFifthDisplay();
}

document.getElementById("toggleFifth").addEventListener("change", updateFifthDisplay);

function updateFifthDisplay() {
  const list2 = document.getElementById("list2");
  const showFifth = !document.getElementById("toggleFifth").checked;

  if (showFifth && lastSplits5unique.length > 0) {
    list2.innerHTML =
      "<b>Liste 2 (zusätzlich durch Würfel 5):</b>\n" + formatSplits(lastSplits5unique);
    list2.classList.add("show");
  } else {
    list2.classList.remove("show");
    list2.innerHTML = "";
  }
}

document.getElementById("toggleDark").addEventListener("click", () => {
  document.body.classList.toggle("dark");

  const btn = document.getElementById("toggleDark");
  if (document.body.classList.contains("dark")) {
    btn.textContent = "Darkmode deaktivieren";
  } else {
    btn.textContent = "Darkmode aktivieren";
  }
});
