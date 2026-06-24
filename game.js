// Galgame Core Controller - game.js

class GalgameEngine {
  constructor() {
    this.script = null;
    this.state = {
      currentActIndex: 0,
      currentNodeIndex: 0,
      activeBranchNodes: null,
      activeBranchNodeIndex: 0,
      unlockedCGs: [],
      history: [] // Backlog dialogue records
    };

    this.settings = {
      textSpeed: 30, // Typing delay in ms
      autoDelay: 2500 // Wait delay in ms
    };

    this.uiState = {
      isTyping: false,
      typingTimer: null,
      fullText: "",
      autoPlay: false,
      skipPlay: false,
      currentBg: "",
      currentRain: false,
      specialCG: null
    };

    // CG details definitions
    this.cgs = [
      { id: 'CG-01', title: '圖書館的午後', desc: '日和靠窗閱讀的側臉，陽光灑在髮絲上', image: 'cg_01_library_afternoon.png', bg: 'bg_library.png' },
      { id: 'CG-02', title: 'Sehnsucht', desc: '夕陽下的圖書館，日和望向窗外的側臉', image: 'cg_02_sehnsucht_sunset.png', bg: 'bg_library.png' },
      { id: 'CG-03', title: '一把傘下', desc: '雨中的校門口，日和小心翼翼地靠近畫面外的傘沿', image: 'cg_03_under_one_umbrella.png', bg: 'bg_school_gate_rain.png' },
      { id: 'CG-04', title: '溫室之中', desc: '夕陽透過玻璃，照亮日和手中的白玫瑰花苞', image: 'cg_04_greenhouse_white_rose.png', bg: 'bg_greenhouse.png' },
      { id: 'CG-05', title: '眼淚的溫度', desc: '圖書館的夕陽下，日和含淚微笑，像剛被溫柔接住', image: 'cg_05_tears_in_library.png', bg: 'bg_library.png' },
      { id: 'CG-06', title: '天台的約定', desc: '港口夕陽前，日和站在天台邊，朝畫面外伸出手', image: 'cg_06_rooftop_promise.png', bg: 'bg_port_sunset.png' },
      { id: 'CG-07', title: '文化祭的屋頂', desc: '文化祭屋頂上，日和坐在欄杆旁，下方是熱鬧的祭典燈火', image: 'cg_07_festival_rooftop.png', bg: 'bg_port_sunset.png' },
      { id: 'CG-08', title: '平安夜', desc: '港口初雪中，日和閉上眼睛，遠處燈塔閃爍', image: 'cg_08_christmas_eve_snow.png', bg: 'bg_port_sunset.png' },
      { id: 'CG-09', title: '告白', desc: '圖書館二樓的夕陽下，日和將手伸向畫面外，溫柔回望', image: 'cg_09_confession_library.png', bg: 'bg_library.png' },
      { id: 'CG-10', title: '永遠的約定', desc: '溫室中盛開的白玫瑰環繞日和，夕陽灑滿全身', image: 'cg_10_forever_promise.png', bg: 'bg_greenhouse.png' }
    ];

    this.init();
  }

  async init() {
    this.cacheDomElements();
    this.setMenuLoading(true);
    this.bindEvents();
    this.loadSettings();
    this.loadUnlockedCGs();

    // Load the script JSON file
    try {
      const response = await fetch('game_script.json');
      this.script = await response.json();
      console.log('Script loaded successfully!', this.script);
      this.setMenuLoading(false);
      this.updateSaveLoadUI();
    } catch (e) {
      console.error('Failed to load game script JSON:', e);
      this.setMenuLoading(false);
      this.dom.dialogueText.textContent = "載入劇本失敗，請確認 game_script.json 是否生成。";
    }
  }

  setMenuLoading(isLoading) {
    if (!this.dom?.btnStart || !this.dom?.btnLoadMenu) return;
    this.dom.btnStart.disabled = isLoading;
    this.dom.btnLoadMenu.disabled = isLoading;
    this.dom.btnStart.textContent = isLoading ? '載入中...' : '新遊戲';
  }

  cacheDomElements() {
    this.dom = {
      container: document.getElementById('game-container'),
      bgLayer: document.getElementById('bg-layer'),
      bgLayerTemp: document.getElementById('bg-layer-temp'),
      rainOverlay: document.getElementById('rain-overlay'),
      flashOverlay: document.getElementById('flash-overlay'),

      // Character sprites
      charLeft: document.getElementById('char-left'),
      charCenter: document.getElementById('char-center'),
      charRight: document.getElementById('char-right'),
      spriteLeft: document.querySelector('#char-left img'),
      spriteCenter: document.querySelector('#char-center img'),
      spriteRight: document.querySelector('#char-right img'),

      // Special CG presentation
      specialCGOverlay: document.getElementById('special-cg-overlay'),
      specialCGImg: document.getElementById('special-cg-img'),
      specialCGTitle: document.getElementById('special-cg-title'),
      specialCGText: document.getElementById('special-cg-text'),
      specialCGPrompt: document.getElementById('special-cg-prompt'),

      // Screen Sections
      mainMenu: document.getElementById('main-menu'),
      gamePlayUi: document.getElementById('game-play-ui'),

      // HUD
      actTitleDisplay: document.getElementById('act-title-display'),
      dialogueBox: document.getElementById('dialogue-box-container'),
      nameTag: document.getElementById('name-tag-container'),
      speakerName: document.getElementById('speaker-name'),
      dialogueText: document.getElementById('dialogue-text'),
      clickPrompt: document.getElementById('click-prompt'),
      choiceContainer: document.getElementById('choice-container'),
      choiceList: document.getElementById('choice-list'),

      // Buttons
      btnStart: document.getElementById('btn-start'),
      btnLoadMenu: document.getElementById('btn-load-menu'),
      btnGalleryMenu: document.getElementById('btn-gallery-menu'),
      btnSettingsMenu: document.getElementById('btn-settings-menu'),

      // Modals
      logPanel: document.getElementById('log-panel'),
      saveloadPanel: document.getElementById('saveload-panel'),
      galleryPanel: document.getElementById('gallery-panel'),
      settingsPanel: document.getElementById('settings-panel'),

      // Modal Close Buttons
      btnCloseLog: document.getElementById('btn-close-log'),
      btnCloseSaveload: document.getElementById('btn-close-saveload'),
      btnCloseGallery: document.getElementById('btn-close-gallery'),
      btnCloseSettings: document.getElementById('btn-close-settings'),

      // Modal Bodies/Content
      logList: document.getElementById('log-list'),
      saveloadTitle: document.getElementById('saveload-title'),
      galleryGrid: document.getElementById('gallery-grid'),

      // Lightbox
      cgLightbox: document.getElementById('cg-lightbox'),
      lightboxImg: document.getElementById('lightbox-img'),
      lightboxTitle: document.getElementById('lightbox-title'),
      lightboxDesc: document.getElementById('lightbox-desc'),
      btnCloseLightbox: document.getElementById('btn-close-lightbox'),

      // Quick actions
      btnQLog: document.getElementById('btn-quick-log'),
      btnQAuto: document.getElementById('btn-quick-auto'),
      btnQSkip: document.getElementById('btn-quick-skip'),
      btnQSave: document.getElementById('btn-quick-save'),
      btnQLoad: document.getElementById('btn-quick-load'),
      btnQMenu: document.getElementById('btn-quick-menu'),

      // Settings controllers
      textSpeedSlider: document.getElementById('text-speed-slider'),
      textSpeedValue: document.getElementById('text-speed-value'),
      autoDelaySlider: document.getElementById('auto-delay-slider'),
      autoDelayValue: document.getElementById('auto-delay-value'),
      btnResetData: document.getElementById('btn-reset-data')
    };
  }

  bindEvents() {
    // Menu Actions
    this.dom.btnStart.addEventListener('click', () => this.startGame());
    this.dom.btnLoadMenu.addEventListener('click', () => this.openSaveLoad(false));
    this.dom.btnGalleryMenu.addEventListener('click', () => this.openGallery());
    this.dom.btnSettingsMenu.addEventListener('click', () => this.openSettings());

    // Modal Closes
    this.dom.btnCloseLog.addEventListener('click', () => this.closePanel(this.dom.logPanel));
    this.dom.btnCloseSaveload.addEventListener('click', () => this.closePanel(this.dom.saveloadPanel));
    this.dom.btnCloseGallery.addEventListener('click', () => this.closePanel(this.dom.galleryPanel));
    this.dom.btnCloseSettings.addEventListener('click', () => this.closePanel(this.dom.settingsPanel));
    this.dom.btnCloseLightbox.addEventListener('click', () => this.dom.cgLightbox.classList.add('hidden'));

    // Quick Bar Actions
    this.dom.btnQLog.addEventListener('click', (e) => { e.stopPropagation(); this.openLog(); });
    this.dom.btnQAuto.addEventListener('click', (e) => { e.stopPropagation(); this.toggleAuto(); });
    this.dom.btnQSkip.addEventListener('click', (e) => { e.stopPropagation(); this.toggleSkip(); });
    this.dom.btnQSave.addEventListener('click', (e) => { e.stopPropagation(); this.openSaveLoad(true); });
    this.dom.btnQLoad.addEventListener('click', (e) => { e.stopPropagation(); this.openSaveLoad(false); });
    this.dom.btnQMenu.addEventListener('click', (e) => { e.stopPropagation(); this.returnToMenu(); });
    this.dom.specialCGOverlay.addEventListener('click', (e) => {
      e.stopPropagation();
      this.advanceSpecialCG();
    });

    // Dialogue Advance Click
    this.dom.dialogueBox.addEventListener('click', () => this.advanceDialogue());
    // Also support clicking the background layer to advance text (when choices/menus are not active)
    this.dom.container.addEventListener('click', (e) => {
      // Check if click was inside active elements
      if (
        this.dom.mainMenu.classList.contains('hidden') &&
        this.dom.choiceContainer.classList.contains('hidden') &&
        !this.dom.dialogueBox.contains(e.target) &&
        e.target.tagName !== 'BUTTON' &&
        !e.target.closest('.modal-overlay') &&
        !e.target.closest('#cg-lightbox')
      ) {
        this.advanceDialogue();
      }
    });

    // Slider settings
    this.dom.textSpeedSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      this.settings.textSpeed = 110 - val; // Reverse scale so higher value = faster (smaller interval)
      this.dom.textSpeedValue.textContent = val < 40 ? '較慢' : val < 80 ? '正常' : '較快';
      this.saveSettings();
    });

    this.dom.autoDelaySlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.settings.autoDelay = val * 1000;
      this.dom.autoDelayValue.textContent = val + 's';
      this.saveSettings();
    });

    this.dom.btnResetData.addEventListener('click', () => {
      if (confirm('確定要清除所有遊戲進度、存檔與已解鎖的 CG 畫廊嗎？這項操作無法復原。')) {
        localStorage.clear();
        this.state = {
          currentActIndex: 0,
          currentNodeIndex: 0,
          activeBranchNodes: null,
          activeBranchNodeIndex: 0,
          unlockedCGs: [],
          history: []
        };
        this.loadUnlockedCGs();
        this.updateSaveLoadUI();
        alert('數據已初始化！');
        this.closePanel(this.dom.settingsPanel);
      }
    });

    // Keyboard support
    window.addEventListener('keydown', (e) => {
      if (this.uiState.specialCG && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        this.advanceSpecialCG();
        return;
      }

      if (this.dom.mainMenu.classList.contains('hidden') && this.dom.choiceContainer.classList.contains('hidden')) {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          this.advanceDialogue();
        }
      }
    });
  }

  loadSettings() {
    const saved = localStorage.getItem('gal_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      this.settings = parsed;
      this.dom.textSpeedSlider.value = 110 - this.settings.textSpeed;
      const speedVal = 110 - this.settings.textSpeed;
      this.dom.textSpeedValue.textContent = speedVal < 40 ? '較慢' : speedVal < 80 ? '正常' : '較快';
      this.dom.autoDelaySlider.value = this.settings.autoDelay / 1000;
      this.dom.autoDelayValue.textContent = (this.settings.autoDelay / 1000) + 's';
    }
  }

  saveSettings() {
    localStorage.setItem('gal_settings', JSON.stringify(this.settings));
  }

  loadUnlockedCGs() {
    const saved = localStorage.getItem('gal_unlocked_cgs');
    if (saved) {
      this.state.unlockedCGs = JSON.parse(saved);
    } else {
      this.state.unlockedCGs = [];
    }
  }

  saveUnlockedCGs() {
    localStorage.setItem('gal_unlocked_cgs', JSON.stringify(this.state.unlockedCGs));
  }

  // --- GAME FLOW LOGIC ---

  startGame() {
    if (!this.script?.acts?.length) {
      console.error('Game script is not loaded yet.');
      this.dom.dialogueText.textContent = '劇本還沒載入完成，請稍等一下再開始。';
      return;
    }

    this.dom.mainMenu.classList.add('hidden');
    this.dom.gamePlayUi.classList.remove('hidden');
    this.dom.container.classList.remove('menu-active');

    this.state.currentActIndex = 0;
    this.state.currentNodeIndex = 0;
    this.state.activeBranchNodes = null;
    this.state.activeBranchNodeIndex = 0;
    this.state.history = [];

    this.uiState.autoPlay = false;
    this.uiState.skipPlay = false;
    this.updateQuickMenuUI();

    this.loadSceneMetadata();
    this.playNode();
  }

  loadSceneMetadata() {
    const act = this.script.acts[this.state.currentActIndex];
    if (!act) return;

    this.dom.actTitleDisplay.textContent = `第${act.id}幕：${act.title}`;

    // Apply Background BGs
    const bgFile = this.getBgPath(act.metadata.location);
    this.setBackground(bgFile);

    // Apply Rain Effect
    const isRain = act.metadata.location.includes('雨') || act.id === 4;
    if (isRain) {
      this.dom.rainOverlay.classList.remove('hidden');
      this.uiState.currentRain = true;
    } else {
      this.dom.rainOverlay.classList.add('hidden');
      this.uiState.currentRain = false;
    }
  }

  setBackground(bgFile) {
    const fullPath = this.resolveImagePath(bgFile);
    if (this.uiState.currentBg === fullPath) return;

    this.uiState.currentBg = fullPath;

    const img = new Image();
    img.onload = () => {
      // Smooth crossfade only after the image is actually available.
      this.dom.bgLayerTemp.style.backgroundImage = `url('${fullPath}')`;
      this.dom.bgLayerTemp.classList.remove('hidden');
      this.dom.bgLayerTemp.style.opacity = 1;

      setTimeout(() => {
        this.dom.bgLayer.style.backgroundImage = `url('${fullPath}')`;
        this.dom.bgLayerTemp.style.opacity = 0;
        this.dom.bgLayerTemp.classList.add('hidden');
      }, 800);
    };
    img.onerror = () => {
      console.error(`Background image failed to load: ${fullPath}`);
      if (fullPath !== 'assets/images/backgrounds/bg_library.png') {
        this.uiState.currentBg = '';
        this.setBackground('bg_library.png');
      }
    };
    img.src = fullPath;
  }

  resolveImagePath(fileName, directory = 'backgrounds') {
    if (!fileName) return '';
    if (fileName.includes('/')) return fileName;
    return `assets/images/${directory}/${fileName}`;
  }

  getCGImagePath(cg) {
    return this.resolveImagePath(cg.image, 'cgs');
  }

  getBgPath(location) {
    if (!location) return 'bg_library.png';
    const loc = location.toLowerCase();
    if (loc.includes('special_cg') || loc.includes('特殊cg') || loc.includes('cgs/special_cg')) {
      return 'assets/images/cgs/special_cg.png';
    }
    if (loc.includes('圖書館') || loc.includes('文藝社')) {
      return 'bg_library.png';
    }
    if (loc.includes('教室')) {
      return 'bg_classroom.png';
    }
    if (loc.includes('溫室')) {
      return 'bg_greenhouse.png';
    }
    if (loc.includes('校門口') || loc.includes('雨')) {
      return 'bg_school_gate_rain.png';
    }
    if (loc.includes('港口') || loc.includes('商店街') || loc.includes('天台') || loc.includes('屋頂')) {
      return 'bg_port_sunset.png';
    }
    return 'bg_library.png';
  }

  getCharacterSprite(character, expression) {
    if (character !== '日和') return null;
    if (!expression) return 'assets/images/characters/hiyori_normal.png';

    const exp = expression.toLowerCase();
    if (exp.includes('微笑') || exp.includes('笑') || exp.includes('開心的') || exp.includes('幸福')) {
      return 'assets/images/characters/hiyori_smile.png';
    }
    if (exp.includes('害羞') || exp.includes('臉紅') || exp.includes('紅')) {
      return 'assets/images/characters/hiyori_shy.png';
    }
    if (exp.includes('驚訝') || exp.includes('睜大') || exp.includes('啊')) {
      return 'assets/images/characters/hiyori_surprised.png';
    }
    if (exp.includes('困擾') || exp.includes('憂慮') || exp.includes('蹙眉') || exp.includes('退縮') || exp.includes('哭') || exp.includes('淚') || exp.includes('悲傷')) {
      return 'assets/images/characters/hiyori_troubled.png';
    }
    return 'assets/images/characters/hiyori_normal.png';
  }

  getCurrentNode() {
    const act = this.script.acts[this.state.currentActIndex];
    if (!act) return null;

    if (this.state.activeBranchNodes) {
      return this.state.activeBranchNodes[this.state.activeBranchNodeIndex];
    }
    return act.nodes[this.state.currentNodeIndex];
  }

  advanceNodeIndex() {
    if (this.state.activeBranchNodes) {
      this.state.activeBranchNodeIndex++;
      if (this.state.activeBranchNodeIndex >= this.state.activeBranchNodes.length) {
        // Finished branch, return to main sequence
        this.state.activeBranchNodes = null;
        this.state.activeBranchNodeIndex = 0;
        this.state.currentNodeIndex++;
      }
    } else {
      this.state.currentNodeIndex++;
    }
  }

  playNode() {
    this.dom.clickPrompt.classList.add('hidden');

    const node = this.getCurrentNode();
    if (!node) {
      // Act ended naturally if we run out of nodes without act_end
      this.nextAct();
      return;
    }

    console.log('Playing Node:', node);

    switch (node.type) {
      case 'scene_desc':
        this.clearCharacters();
        this.dom.nameTag.classList.add('hidden');
        this.typeText(`【場景：${node.text}】`);
        break;

      case 'action':
        this.dom.nameTag.classList.add('hidden');
        this.typeText(`*${node.text}*`);
        break;

      case 'dialogue':
        this.displayCharacter(node.speaker, node.expression);

        // Setup speaker name tag
        this.dom.nameTag.classList.remove('hidden');
        this.dom.speakerName.textContent = node.speaker;

        // Class styling for narrator monologues
        if (node.isMonologue) {
          this.dom.dialogueText.classList.add('monologue');
          this.typeText(`（${node.text}）`);
        } else {
          this.dom.dialogueText.classList.remove('monologue');
          this.typeText(`「${node.text}」`);
        }

        // Add to Backlog
        this.state.history.push({
          speaker: node.speaker,
          text: node.text,
          isMonologue: node.isMonologue
        });
        break;

      case 'choice':
        this.showChoices(node);
        break;

      case 'cg_unlock':
        this.unlockCG(node.cgId);
        this.startSpecialCG(node);
        break;

      case 'convergence':
        // A branch convergence point, just display and proceed
        this.dom.nameTag.classList.add('hidden');
        this.typeText(`*${node.text}*`);
        break;

      case 'act_end':
        this.nextAct();
        break;

      default:
        console.warn('Unknown node type:', node.type);
        this.advanceNodeIndex();
        this.playNode();
    }
  }

  displayCharacter(speaker, expression) {
    // Hide all character slots first
    this.dom.charLeft.classList.remove('active');
    this.dom.charCenter.classList.remove('active');
    this.dom.charRight.classList.remove('active');

    // Do not display characters in Act 16 (special_cg scene)
    const act = this.script?.acts[this.state.currentActIndex];
    if (act && (act.id === 16 || (act.metadata?.location && act.metadata.location.toLowerCase().includes('special_cg')))) {
      return;
    }

    const spritePath = this.getCharacterSprite(speaker, expression);
    if (spritePath) {
      // Hiyori stands in the center
      this.dom.spriteCenter.src = spritePath;
      this.dom.charCenter.classList.add('active');
    }
  }

  clearCharacters() {
    this.dom.charLeft.classList.remove('active');
    this.dom.charCenter.classList.remove('active');
    this.dom.charRight.classList.remove('active');
  }

  triggerFlash() {
    this.dom.flashOverlay.style.opacity = 1;
    setTimeout(() => {
      this.dom.flashOverlay.style.opacity = 0;
    }, 300);
  }

  startSpecialCG(node) {
    const cg = this.cgs.find(c => c.id === node.cgId);
    if (!cg) {
      this.typeText(`★ 獲得 CG 插圖：【${node.title}】— ${node.description}`);
      return;
    }

    if (this.uiState.typingTimer) {
      clearTimeout(this.uiState.typingTimer);
    }

    this.uiState.specialCG = {
      node,
      cg,
      lineIndex: 0,
      lines: this.getSpecialCGLines(node, cg),
      previousAuto: this.uiState.autoPlay,
      previousSkip: this.uiState.skipPlay
    };

    this.uiState.isTyping = false;
    this.uiState.autoPlay = false;
    this.uiState.skipPlay = false;
    this.updateQuickMenuUI();

    this.dom.nameTag.classList.add('hidden');
    this.dom.clickPrompt.classList.add('hidden');
    this.dom.specialCGPrompt.classList.add('hidden');
    this.clearCharacters();
    this.triggerFlash();

    this.dom.specialCGImg.src = this.getCGImagePath(cg);
    this.dom.specialCGImg.alt = node.title || cg.title;
    this.dom.specialCGTitle.textContent = `CG 解鎖：${node.title || cg.title}`;
    this.dom.specialCGText.textContent = "";
    this.dom.specialCGOverlay.classList.remove('hidden');

    this.typeSpecialCGLine(this.uiState.specialCG.lines[0]);
  }

  getSpecialCGLines(node, cg) {
    if (Array.isArray(node.lines) && node.lines.length) return node.lines;
    if (Array.isArray(node.dialogues) && node.dialogues.length) return node.dialogues;

    return [
      `【${node.title || cg.title}】`,
      node.description || cg.desc,
      '這一幕已收錄到 CG 畫廊。'
    ].filter(Boolean);
  }

  typeSpecialCGLine(text) {
    if (this.uiState.typingTimer) {
      clearTimeout(this.uiState.typingTimer);
    }

    this.uiState.isTyping = true;
    this.uiState.fullText = text;
    this.dom.specialCGText.textContent = "";
    this.dom.specialCGPrompt.classList.add('hidden');

    let index = 0;

    const typeChar = () => {
      if (!this.uiState.isTyping) {
        this.dom.specialCGText.textContent = text;
        this.onSpecialCGLineComplete();
        return;
      }

      if (index < text.length) {
        this.dom.specialCGText.textContent += text[index];
        index++;
        this.uiState.typingTimer = setTimeout(typeChar, this.settings.textSpeed);
      } else {
        this.onSpecialCGLineComplete();
      }
    };

    typeChar();
  }

  onSpecialCGLineComplete() {
    this.uiState.isTyping = false;
    this.dom.specialCGPrompt.classList.remove('hidden');
  }

  advanceSpecialCG() {
    const specialCG = this.uiState.specialCG;
    if (!specialCG) return;

    if (this.uiState.isTyping) {
      this.uiState.isTyping = false;
      this.dom.specialCGText.textContent = this.uiState.fullText;
      this.onSpecialCGLineComplete();
      return;
    }

    specialCG.lineIndex++;
    if (specialCG.lineIndex < specialCG.lines.length) {
      this.typeSpecialCGLine(specialCG.lines[specialCG.lineIndex]);
      return;
    }

    this.finishSpecialCG();
  }

  finishSpecialCG() {
    const specialCG = this.uiState.specialCG;
    if (!specialCG) return;

    if (this.uiState.typingTimer) {
      clearTimeout(this.uiState.typingTimer);
    }

    this.dom.specialCGOverlay.classList.add('hidden');
    this.dom.specialCGImg.src = "";
    this.dom.specialCGText.textContent = "";
    this.dom.specialCGPrompt.classList.add('hidden');

    this.uiState.isTyping = false;
    this.uiState.specialCG = null;
    this.uiState.autoPlay = specialCG.previousAuto;
    this.uiState.skipPlay = specialCG.previousSkip;
    this.updateQuickMenuUI();

    this.advanceNodeIndex();
    this.playNode();
  }

  typeText(text) {
    if (this.uiState.typingTimer) {
      clearTimeout(this.uiState.typingTimer);
    }

    this.uiState.isTyping = true;
    this.uiState.fullText = text;
    this.dom.dialogueText.textContent = "";

    let index = 0;

    const typeChar = () => {
      // If user skipped or auto fast text complete
      if (!this.uiState.isTyping) {
        this.dom.dialogueText.textContent = text;
        this.onTextComplete();
        return;
      }

      if (index < text.length) {
        // Fast forward skip speed
        if (this.uiState.skipPlay) {
          this.dom.dialogueText.textContent = text;
          this.onTextComplete();
          return;
        }

        this.dom.dialogueText.textContent += text[index];
        index++;
        this.uiState.typingTimer = setTimeout(typeChar, this.settings.textSpeed);
      } else {
        this.onTextComplete();
      }
    };

    typeChar();
  }

  onTextComplete() {
    this.uiState.isTyping = false;
    this.dom.clickPrompt.classList.remove('hidden');

    // Auto Play handling
    if (this.uiState.autoPlay && !this.uiState.skipPlay) {
      this.uiState.typingTimer = setTimeout(() => {
        if (!this.dom.choiceContainer.classList.contains('hidden')) return; // Don't auto advance on choices
        this.advanceDialogue();
      }, this.settings.autoDelay);
    } else if (this.uiState.skipPlay) {
      // Skip logic with tiny delay
      this.uiState.typingTimer = setTimeout(() => {
        if (!this.dom.choiceContainer.classList.contains('hidden')) return;
        this.advanceDialogue();
      }, 80);
    }
  }

  advanceDialogue() {
    if (this.uiState.specialCG) {
      this.advanceSpecialCG();
      return;
    }

    if (this.uiState.isTyping) {
      // Complete text immediately
      this.uiState.isTyping = false;
      this.dom.dialogueText.textContent = this.uiState.fullText;
      return;
    }

    if (this.uiState.typingTimer) {
      clearTimeout(this.uiState.typingTimer);
    }

    // Check if choice is active
    if (!this.dom.choiceContainer.classList.contains('hidden')) {
      return; // Do nothing, user must choose
    }

    this.advanceNodeIndex();
    this.playNode();
  }

  showChoices(node) {
    this.dom.choiceList.innerHTML = "";
    this.dom.choiceContainer.classList.remove('hidden');

    // Stop auto-play/skip temporarily
    const previousAuto = this.uiState.autoPlay;
    const previousSkip = this.uiState.skipPlay;
    this.uiState.autoPlay = false;
    this.uiState.skipPlay = false;
    this.updateQuickMenuUI();

    node.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = opt.text;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dom.choiceContainer.classList.add('hidden');

        // Direct flow to branch sub-nodes
        this.state.activeBranchNodes = opt.nodes;
        this.state.activeBranchNodeIndex = 0;

        // Restore play modes
        this.uiState.autoPlay = previousAuto;
        this.uiState.skipPlay = previousSkip;
        this.updateQuickMenuUI();

        // Advance to first node in the selected branch
        this.playNode();
      });

      this.dom.choiceList.appendChild(btn);
    });
  }

  nextAct() {
    this.state.currentActIndex++;
    if (this.state.currentActIndex >= this.script.acts.length) {
      // Story Ended! Return to Menu
      alert("故事圓滿結束！謝謝您的遊玩，椎名日和線已完結。");
      this.returnToMenu();
    } else {
      this.state.currentNodeIndex = 0;
      this.state.activeBranchNodes = null;
      this.state.activeBranchNodeIndex = 0;

      this.triggerFlash();
      this.loadSceneMetadata();
      this.playNode();
    }
  }

  unlockCG(cgId) {
    if (!this.state.unlockedCGs.includes(cgId)) {
      this.state.unlockedCGs.push(cgId);
      this.saveUnlockedCGs();
      console.log(`Unlocked CG: ${cgId}`);
    }
  }

  returnToMenu() {
    if (this.uiState.typingTimer) {
      clearTimeout(this.uiState.typingTimer);
    }
    this.uiState.autoPlay = false;
    this.uiState.skipPlay = false;

    this.dom.gamePlayUi.classList.add('hidden');
    this.dom.choiceContainer.classList.add('hidden');
    this.dom.specialCGOverlay.classList.add('hidden');
    this.dom.mainMenu.classList.remove('hidden');
    this.dom.container.classList.add('menu-active');

    // Reset bg to library for menu
    this.dom.bgLayer.style.backgroundImage = "url('assets/images/backgrounds/bg_library.png')";
    this.dom.rainOverlay.classList.add('hidden');
    this.clearCharacters();
  }

  // --- HUD ACTIONS CONTROLS ---

  toggleAuto() {
    this.uiState.autoPlay = !this.uiState.autoPlay;
    if (this.uiState.autoPlay) {
      this.uiState.skipPlay = false;
      if (!this.uiState.isTyping) {
        this.advanceDialogue();
      }
    }
    this.updateQuickMenuUI();
  }

  toggleSkip() {
    this.uiState.skipPlay = !this.uiState.skipPlay;
    if (this.uiState.skipPlay) {
      this.uiState.autoPlay = false;
      if (!this.uiState.isTyping) {
        this.advanceDialogue();
      }
    }
    this.updateQuickMenuUI();
  }

  updateQuickMenuUI() {
    if (this.uiState.autoPlay) {
      this.dom.btnQAuto.classList.add('active');
    } else {
      this.dom.btnQAuto.classList.remove('active');
    }

    if (this.uiState.skipPlay) {
      this.dom.btnQSkip.classList.add('active');
    } else {
      this.dom.btnQSkip.classList.remove('active');
    }
  }

  // --- MODALS OPEN / CLOSE ---

  openLog() {
    this.dom.logList.innerHTML = "";
    this.dom.logPanel.classList.remove('hidden');

    this.state.history.forEach(h => {
      const item = document.createElement('div');
      item.className = `log-item ${h.speaker === '日和' ? 'hiyori' : h.speaker === '清隆' ? '清隆' : ''}`;

      const name = document.createElement('div');
      name.className = 'log-speaker';
      name.textContent = h.speaker;

      const text = document.createElement('div');
      text.className = 'log-text';
      text.textContent = h.isMonologue ? `（${h.text}）` : `「${h.text}」`;

      item.appendChild(name);
      item.appendChild(text);
      this.dom.logList.appendChild(item);
    });

    // Auto-scroll to bottom of log list
    setTimeout(() => {
      this.dom.logList.scrollTop = this.dom.logList.scrollHeight;
    }, 50);
  }

  closePanel(panel) {
    panel.classList.add('hidden');
  }

  openSettings() {
    this.dom.settingsPanel.classList.remove('hidden');
  }

  openSaveLoad(isSaveMode) {
    this.dom.saveloadPanel.classList.remove('hidden');
    this.dom.saveloadTitle.textContent = isSaveMode ? "儲存遊戲進度" : "讀取遊戲進度";
    this.updateSaveLoadUI(isSaveMode);
  }

  updateSaveLoadUI(isSaveMode = false) {
    const slots = document.querySelectorAll('.save-slot');
    slots.forEach(slot => {
      const slotNum = slot.getAttribute('data-slot');
      const savedData = localStorage.getItem(`gal_save_slot_${slotNum}`);

      const actSpan = slot.querySelector('.slot-act');
      const previewSpan = slot.querySelector('.slot-preview');
      const dateSpan = slot.querySelector('.slot-date');
      const btnSave = slot.querySelector('.btn-save-action');
      const btnLoad = slot.querySelector('.btn-load-action');

      if (savedData) {
        const parsed = JSON.parse(savedData);
        actSpan.textContent = `第${parsed.actId}幕：${parsed.actTitle}`;
        previewSpan.textContent = parsed.textPreview || "對話進行中...";
        dateSpan.textContent = parsed.saveTime;
        btnLoad.disabled = false;
      } else {
        actSpan.textContent = "未有存檔";
        previewSpan.textContent = "沒有資料。";
        dateSpan.textContent = "--/--/-- --:--";
        btnLoad.disabled = true;
      }

      // Re-bind actions to avoid duplicate listeners
      btnSave.onclick = null;
      btnLoad.onclick = null;

      btnSave.onclick = (e) => {
        e.stopPropagation();
        this.saveToSlot(slotNum);
        this.updateSaveLoadUI(isSaveMode);
      };

      btnLoad.onclick = (e) => {
        e.stopPropagation();
        this.loadFromSlot(slotNum);
        this.closePanel(this.dom.saveloadPanel);
      };
    });
  }

  saveToSlot(slotNum) {
    const act = this.script.acts[this.state.currentActIndex];
    if (!act) return;

    const node = this.getCurrentNode();
    let preview = "";
    if (node) {
      preview = node.text || "";
      if (preview.length > 30) {
        preview = preview.substring(0, 30) + "...";
      }
    }

    const now = new Date();
    const saveTime = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const saveData = {
      state: this.state,
      actId: act.id,
      actTitle: act.title,
      textPreview: preview,
      saveTime: saveTime
    };

    localStorage.setItem(`gal_save_slot_${slotNum}`, JSON.stringify(saveData));
    console.log(`Saved progress to Slot ${slotNum}`);
  }

  loadFromSlot(slotNum) {
    const savedData = localStorage.getItem(`gal_save_slot_${slotNum}`);
    if (!savedData) return;

    const parsed = JSON.parse(savedData);

    // Deep copy loaded state
    this.state = JSON.parse(JSON.stringify(parsed.state));

    // Close any active modes
    this.uiState.autoPlay = false;
    this.uiState.skipPlay = false;
    this.uiState.specialCG = null;
    this.updateQuickMenuUI();
    this.dom.specialCGOverlay.classList.add('hidden');

    // Toggle screen layouts
    this.dom.mainMenu.classList.add('hidden');
    this.dom.gamePlayUi.classList.remove('hidden');
    this.dom.container.classList.remove('menu-active');

    // Reload UI configurations
    this.loadSceneMetadata();

    // Play active node
    this.playNode();
    console.log(`Loaded progress from Slot ${slotNum}`);
  }

  // --- GALLERY PANEL ---

  openGallery() {
    this.dom.galleryPanel.classList.remove('hidden');
    this.renderGallery();
  }

  renderGallery() {
    this.dom.galleryGrid.innerHTML = "";

    this.cgs.forEach(cg => {
      const item = document.createElement('div');
      item.className = 'gallery-item';

      const isUnlocked = this.state.unlockedCGs.includes(cg.id);

      if (isUnlocked) {
        const img = document.createElement('img');
        img.className = 'gallery-thumbnail';
        img.src = this.getCGImagePath(cg);
        img.alt = cg.title;

        const titleBar = document.createElement('div');
        titleBar.className = 'gallery-title-bar';
        titleBar.textContent = cg.title;

        item.appendChild(img);
        item.appendChild(titleBar);

        // Click to open lightbox
        item.addEventListener('click', () => {
          this.dom.lightboxImg.src = this.getCGImagePath(cg);
          this.dom.lightboxTitle.textContent = cg.title;
          this.dom.lightboxDesc.textContent = cg.desc;
          this.dom.cgLightbox.classList.remove('hidden');
        });
      } else {
        const lockedDiv = document.createElement('div');
        lockedDiv.className = 'gallery-locked';

        // Inline Lock SVG
        lockedDiv.innerHTML = `
          <svg viewBox="0 0 24 24">
            <path d="M18,8H17V6A5,5,0,0,0,7,6V8H6a3,3,0,0,0-3,3v8a3,3,0,0,0,3,3H18a3,3,0,0,0,3-3V11A3,3,0,0,0,18,8ZM9,6a3,3,0,0,1,6,0V8H9ZM18,20H6a1,1,0,0,1-1-1V11a1,1,0,0,1,1-1H18a1,1,0,0,1,1,1v8A1,1,0,0,1,18,20Z"/>
          </svg>
          <span>未解鎖</span>
        `;

        item.appendChild(lockedDiv);
      }

      this.dom.galleryGrid.appendChild(item);
    });
  }
}

// Start Engine on page loaded
window.addEventListener('DOMContentLoaded', () => {
  window.gameEngine = new GalgameEngine();
});
