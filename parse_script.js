const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, 'GAL劇本_椎名日和線.md');
const outputPath = path.join(__dirname, 'game_script.json');

function parseScript() {
  if (!fs.existsSync(scriptPath)) {
    console.error(`Script file not found: ${scriptPath}`);
    process.exit(1);
  }

  const rawContent = fs.readFileSync(scriptPath, 'utf8');
  const lines = rawContent.split(/\r?\n/);

  const game = {
    acts: []
  };

  let currentAct = null;
  let currentSpeaker = null;
  let currentExpression = null;
  let currentChoice = null;
  let currentBranch = null;

  // Regex definitions
  const actRegex = /^##\s+第\s*(\d+)\s*幕：\s*(.*)$/;
  const locRegex = /^\*\*地點：\s*(.*)\*\*$/;
  const timeRegex = /^\*\*時間：\s*(.*)\*\*$/;
  const bgmRegex = /^\*\*BGM：\s*(.*)\*\*$/;
  const seRegex = /^\*\*(特殊效果|特殊特效)：\s*(.*)\*\*$/;
  const sceneDescRegex = /^\*\*【場景：\s*(.*)】\*\*$/;

  // Speaker header e.g. **清隆**（独白）： or **日和**（通常·抱書，未注意到清隆）： or **班導**：
  const speakerRegex = /^\*\*(.*?)\*\*(?:（(.*?)）)?：$/;

  // Dialogue quote e.g. > 「......」 or > （......）
  const dialogueRegex = /^>\s*(.*)$/;

  // Choice option e.g. > **A）「......」**
  const choiceOptionRegex = /^>\s*\*\*([A-C])）\s*(.*)\*\*$/;

  // Choice block header e.g. **【選擇肢 1-1】**
  const choiceHeaderRegex = /^\*\*【選擇肢\s*(\d+-\d+)】\*\*$/;

  // Choice branch header e.g. **【選擇A】** or **【選擇A → 進入禮物劇情】**
  const branchHeaderRegex = /^\*\*【選擇([A-C])(?:.*?)\】\*\*$/;

  // CG unlock e.g. **【獲得：CG-01「圖書館的午後」— 日和靠窗閱讀的側臉，陽光灑在髮絲上】**
  const cgRegex = /^\*\*【獲得：\s*(CG-\d+)「(.*?)」\s*—\s*(.*?)】\*\*$/;

  // Act end e.g. **【幕結束】**
  const actEndRegex = /^\*\*【幕結束】\*\*$/;

  // Convergence e.g. **【匯流：以下劇情三選共通】**
  const convergenceRegex = /^\*\*【匯流：\s*(.*)】\*\*$/;

  // Action e.g. *——清隆輕輕走過去，在附近的書架前停下，抽出一本書。*
  const actionRegex = /^\*(.*?)\*$/;

  function addNode(node) {
    if (!currentAct) return;
    if (currentChoice && currentBranch) {
      // Find the option in the current choice
      const option = currentChoice.options.find(opt => opt.key === currentBranch);
      if (option) {
        option.nodes.push(node);
      } else {
        console.warn(`Warning: Branch option ${currentBranch} not found in choice ${currentChoice.id}`);
      }
    } else {
      currentAct.nodes.push(node);
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // 1. Act Header
    let match = line.match(actRegex);
    if (match) {
      // If there was an active choice, close it before moving to the next act
      if (currentChoice) {
        currentAct.nodes.push(currentChoice);
        currentChoice = null;
        currentBranch = null;
      }

      currentAct = {
        id: parseInt(match[1], 10),
        title: match[2].trim(),
        metadata: {
          location: '',
          time: '',
          bgm: '',
          se: ''
        },
        nodes: []
      };
      game.acts.push(currentAct);
      currentSpeaker = null;
      currentExpression = null;
      continue;
    }

    if (!currentAct) continue;

    // 2. Metadata
    if ((match = line.match(locRegex))) {
      currentAct.metadata.location = match[1].trim();
      continue;
    }
    if ((match = line.match(timeRegex))) {
      currentAct.metadata.time = match[1].trim();
      continue;
    }
    if ((match = line.match(bgmRegex))) {
      currentAct.metadata.bgm = match[1].trim();
      continue;
    }
    if ((match = line.match(seRegex))) {
      currentAct.metadata.se = match[2].trim();
      continue;
    }

    // 3. Act End
    if (line.match(actEndRegex)) {
      if (currentChoice) {
        currentAct.nodes.push(currentChoice);
        currentChoice = null;
        currentBranch = null;
      }
      addNode({
        type: 'act_end'
      });
      continue;
    }

    // 4. CG Unlock
    if ((match = line.match(cgRegex))) {
      addNode({
        type: 'cg_unlock',
        cgId: match[1].trim(),
        title: match[2].trim(),
        description: match[3].trim()
      });
      continue;
    }

    // 5. Choice block start
    if ((match = line.match(choiceHeaderRegex))) {
      // If there was an active choice, close it first
      if (currentChoice) {
        currentAct.nodes.push(currentChoice);
      }
      currentChoice = {
        type: 'choice',
        id: match[1],
        options: []
      };
      currentBranch = null;
      continue;
    }

    // 6. Choice options (lines starting with > **A）...)
    if ((match = line.match(choiceOptionRegex))) {
      if (currentChoice) {
        currentChoice.options.push({
          key: match[1],
          text: match[2].trim(),
          nodes: []
        });
      } else {
        console.warn(`Warning: Choice option found outside of a choice block: ${line}`);
      }
      continue;
    }

    // 7. Choice Branch Start (e.g. **【選擇A】**)
    if ((match = line.match(branchHeaderRegex))) {
      currentBranch = match[1];
      continue;
    }

    // 8. Convergence Point (e.g. **【匯流：...】**)
    if ((match = line.match(convergenceRegex))) {
      if (currentChoice) {
        currentAct.nodes.push(currentChoice);
        currentChoice = null;
        currentBranch = null;
      }
      addNode({
        type: 'convergence',
        text: match[1].trim()
      });
      continue;
    }

    // 9. Scene Description (e.g. **【場景：...】**)
    if ((match = line.match(sceneDescRegex))) {
      // A scene description can also implicitly end a choice block if we are in one and hit a convergence scene
      if (currentChoice && currentBranch) {
        currentAct.nodes.push(currentChoice);
        currentChoice = null;
        currentBranch = null;
      }
      addNode({
        type: 'scene_desc',
        text: match[1].trim()
      });
      continue;
    }

    // 10. Speaker Header (e.g. **清隆**（独白）：)
    if ((match = line.match(speakerRegex))) {
      currentSpeaker = match[1].trim();
      currentExpression = match[2] ? match[2].trim() : null;
      continue;
    }

    // 11. Dialogue Quote (e.g. > 「......」 or > （......）)
    if ((match = line.match(dialogueRegex))) {
      if (currentSpeaker) {
        const textVal = match[1].trim();
        const isMonologue = textVal.startsWith('（') && textVal.endsWith('）');
        // Clean outer brackets if it's monologue/dialogue
        let cleanedText = textVal;
        if (isMonologue) {
          cleanedText = textVal.substring(1, textVal.length - 1);
        } else if (textVal.startsWith('「') && textVal.endsWith('」')) {
          cleanedText = textVal.substring(1, textVal.length - 1);
        }

        addNode({
          type: 'dialogue',
          speaker: currentSpeaker,
          expression: currentExpression,
          text: cleanedText,
          isMonologue: isMonologue
        });
        // We do not reset speaker/expression because they might speak multiple lines,
        // although in the script each paragraph has a speaker header.
      } else {
        // It's a dialogue quote without speaker, could be narrator or system text
        const textVal = match[1].trim();
        addNode({
          type: 'narrative',
          text: textVal
        });
      }
      continue;
    }

    // 12. Action lines (e.g. *——清隆輕輕走過去...*)
    if ((match = line.match(actionRegex))) {
      let actionText = match[1].trim();
      if (actionText.startsWith('——')) {
        actionText = actionText.substring(2).trim();
      }
      addNode({
        type: 'action',
        text: actionText
      });
      continue;
    }

    // If it's a separator line like --- and we are in a choice branch,
    // we don't necessarily end the branch yet (until we see another branch or convergence).
    if (line === '---') {
      continue;
    }

    // If we get here, it's an unhandled line format (could be headers, notes, theme song concept, etc.)
    // We can just log it or skip it
    // console.log(`Skipped line: ${line}`);
  }

  // Final check: if game ended but choice is still open, push it
  if (currentChoice) {
    currentAct.nodes.push(currentChoice);
  }

  fs.writeFileSync(outputPath, JSON.stringify(game, null, 2), 'utf8');
  console.log(`Successfully parsed script! Saved to: ${outputPath}`);
  console.log(`Total acts parsed: ${game.acts.length}`);
}

parseScript();
