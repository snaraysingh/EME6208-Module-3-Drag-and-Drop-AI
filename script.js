(function () {
  const MAX_PER_CELEBRITY_BOX = 3;
  const wordBankList = document.getElementById('allItems');
  const dropLists = document.querySelectorAll('.drop-list');
  const bankCountEl = document.getElementById('bankCount');
  const scoreDisplayEl = document.getElementById('scoreDisplay');
  const pointsDisplayEl = document.getElementById('pointsDisplay');
  const streakDisplayEl = document.getElementById('streakDisplay');
  const resetBtn = document.getElementById('resetBtn');

  const stageFrame = document.getElementById('stageFrame');
  const scoreboardBar = document.getElementById('scoreboardBar');
  const exitScreen = document.getElementById('exitScreen');
  const congratsModal = document.getElementById('congratsModal');
  const encoreBtn = document.getElementById('encoreBtn');
  const exitTheaterBtn = document.getElementById('exitTheaterBtn');
  const reenterBtn = document.getElementById('reenterBtn');

  let draggedItem = null;
  let selectedItem = null;
  let streak = 0;

  function shuffleWordBank() {
    const items = Array.from(wordBankList.children);
    for (let i = items.length - 1; i > 0; i--) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
      wordBankList.appendChild(items[randomIndex]);
      items.splice(randomIndex, 1);
    }
  }

  function evaluateItem(item, destinationList) {
    if (destinationList.id === 'allItems') {
      item.classList.remove('correctAnswer', 'wrongAnswer');
      return;
    }

    const expectedBox = item.getAttribute('data-group');
    if (expectedBox === destinationList.id) {
      item.classList.add('correctAnswer');
      item.classList.remove('wrongAnswer');
      streak += 1;
    } else {
      item.classList.add('wrongAnswer');
      item.classList.remove('correctAnswer');
      streak = 0;
    }
  }

  function updateQuizStatus() {
    const remainingInBank = wordBankList.querySelectorAll('li').length;
    bankCountEl.textContent = String(remainingInBank);

    document.querySelectorAll('.celebrity-box').forEach((box) => {
      const count = box.querySelectorAll('li').length;
      const tally = box.querySelector('.slot-tally');
      if (tally) tally.textContent = count + '/3';
    });

    const correctItems = document.querySelectorAll('#mainContainer li.correctAnswer').length;
    scoreDisplayEl.textContent = correctItems + ' / 18';
    pointsDisplayEl.textContent = (correctItems * 100).toLocaleString();
    streakDisplayEl.textContent = streak + 'x';

    if (correctItems === 18 && remainingInBank === 0) {
      congratsModal.hidden = false;
    } else {
      congratsModal.hidden = true;
    }
  }

  function placeItemInList(item, targetList) {
    if (!item || !targetList) return false;

    const isWordBank = targetList.id === 'allItems';
    const currentCount = targetList.querySelectorAll('li').length;
    const alreadyInside = item.parentElement === targetList;

    if (!isWordBank && !alreadyInside && currentCount >= MAX_PER_CELEBRITY_BOX) {
      const boxWrapper = targetList.closest('.panel-box');
      if (boxWrapper) {
        boxWrapper.classList.add('box-full');
        setTimeout(() => boxWrapper.classList.remove('box-full'), 400);
      }
      return false;
    }

    targetList.appendChild(item);
    evaluateItem(item, targetList);
    updateQuizStatus();
    return true;
  }

  function initItems() {
    const allMovieItems = document.querySelectorAll('#allItems li');

    allMovieItems.forEach((item) => {
      item.addEventListener('dragstart', (event) => {
        draggedItem = item;
        item.classList.add('dragging');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', item.id);
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        draggedItem = null;
        document.querySelectorAll('.panel-box').forEach((box) => {
          box.classList.remove('drag-over', 'box-full');
        });
      });

      item.addEventListener('click', (event) => {
        event.stopPropagation();
        if (selectedItem === item) {
          item.classList.remove('selected-item');
          selectedItem = null;
        } else {
          if (selectedItem) selectedItem.classList.remove('selected-item');
          selectedItem = item;
          item.classList.add('selected-item');
        }
      });
    });
  }

  function initDropZones() {
    dropLists.forEach((list) => {
      const panelBox = list.closest('.panel-box');

      list.addEventListener('dragover', (event) => {
        event.preventDefault();
        if (!draggedItem) return;

        const isWordBank = list.id === 'allItems';
        const isFull = !isWordBank &&
          draggedItem.parentElement !== list &&
          list.querySelectorAll('li').length >= MAX_PER_CELEBRITY_BOX;

        if (isFull) {
          event.dataTransfer.dropEffect = 'none';
          if (panelBox) {
            panelBox.classList.remove('drag-over');
            panelBox.classList.add('box-full');
          }
        } else {
          event.dataTransfer.dropEffect = 'move';
          if (panelBox) {
            panelBox.classList.remove('box-full');
            panelBox.classList.add('drag-over');
          }
        }
      });

      list.addEventListener('dragleave', (event) => {
        if (panelBox && !list.contains(event.relatedTarget)) {
          panelBox.classList.remove('drag-over', 'box-full');
        }
      });

      list.addEventListener('drop', (event) => {
        event.preventDefault();
        if (panelBox) panelBox.classList.remove('drag-over', 'box-full');

        const itemId = event.dataTransfer.getData('text/plain');
        const item = draggedItem || document.getElementById(itemId);
        if (item) {
          placeItemInList(item, list);
        }
      });

      if (panelBox) {
        panelBox.addEventListener('click', () => {
          if (selectedItem) {
            const moved = placeItemInList(selectedItem, list);
            if (moved) {
              selectedItem.classList.remove('selected-item');
              selectedItem = null;
            }
          }
        });
      }
    });
  }

  function resetQuiz() {
    const allItems = document.querySelectorAll('.drop-list li');
    allItems.forEach((item) => {
      item.classList.remove('correctAnswer', 'wrongAnswer', 'selected-item');
      wordBankList.appendChild(item);
    });
    selectedItem = null;
    streak = 0;
    congratsModal.hidden = true;
    exitScreen.hidden = true;
    stageFrame.hidden = false;
    scoreboardBar.hidden = false;
    shuffleWordBank();
    updateQuizStatus();
  }

  function exitTheater() {
    congratsModal.hidden = true;
    stageFrame.hidden = true;
    scoreboardBar.hidden = true;
    exitScreen.hidden = false;
  }

  resetBtn.addEventListener('click', resetQuiz);
  encoreBtn.addEventListener('click', resetQuiz);
  exitTheaterBtn.addEventListener('click', exitTheater);
  reenterBtn.addEventListener('click', resetQuiz);

  initItems();
  initDropZones();
  shuffleWordBank();
  updateQuizStatus();
})();
