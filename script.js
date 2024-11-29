let rows = 10; // Default number of rows
let cols = 10; // Default number of columns
let mines = 20; // Default number of mines
let isFirstClick = true; // Flag to check if it's the first click
let grid = []; // Grid data
let isHellMode = false; // Is Hell Mode active

const gameContainer = document.getElementById('game-container');
const difficultySelect = document.getElementById('difficulty');

const LONG_PRESS_DURATION = 500; // Long press duration in milliseconds

// Create the grid
function createGrid(cellSize) {
    // Clear the game container and grid data
    gameContainer.innerHTML = "";
    grid = [];

    for (let i = 0; i < rows; i++) {
        let rowArray = [];
        for (let j = 0; j < cols; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = i;
            cell.dataset.col = j;

            // Set cell dimensions and styles
            cell.style.width = `${cellSize}px`;
            cell.style.height = `${cellSize}px`;
            cell.style.lineHeight = `${cellSize}px`; // Vertical centering
            cell.style.fontSize = `${Math.max(cellSize * 0.4, 12)}px`; // Font size, min 12px
            cell.style.userSelect = 'none'; // Prevent text selection
            cell.style.webkitUserSelect = 'none'; // For Safari
            cell.style.webkitTouchCallout = 'none'; // For iOS Safari

            // Bind event listeners
            bindCellEvents(cell);

            // Add cell to the container
            gameContainer.appendChild(cell);

            // Initialize grid data
            rowArray.push({ isMine: false, isRevealed: false, mineCount: 0 });
        }
        grid.push(rowArray);
    }
}

// Randomly place mines
function placeMines() {
    let placedMines = 0;
    while (placedMines < mines) {
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * cols);

        if (!grid[row][col].isMine) {
            grid[row][col].isMine = true;
            placedMines++;
        }
    }
}

// Adjust mine layout to ensure the first click and surrounding area are safe
function adjustMines(excludeRow, excludeCol) {
    if (rows === 1 && cols === 1) {
        // Hell Mode, place the only mine
        grid[0][0].isMine = true;
        return;
    }

    const safeZone = new Set();
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 0], [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];

    directions.forEach(([dx, dy]) => {
        const newRow = excludeRow + dx;
        const newCol = excludeCol + dy;
        if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
            safeZone.add(`${newRow},${newCol}`);
        }
    });

    grid.forEach((row) => row.forEach((cell) => (cell.isMine = false)));

    let placedMines = 0;
    while (placedMines < mines) {
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * cols);

        if (!safeZone.has(`${row},${col}`) && !grid[row][col].isMine) {
            grid[row][col].isMine = true;
            placedMines++;
        }
    }
}

// Calculate the number of mines around each cell
function calculateNumbers() {
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],          [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (grid[i][j].isMine) continue;

            let mineCount = 0;
            directions.forEach(([dx, dy]) => {
                const newRow = i + dx;
                const newCol = j + dy;
                if (
                    newRow >= 0 && newRow < rows &&
                    newCol >= 0 && newCol < cols &&
                    grid[newRow][newCol].isMine
                ) {
                    mineCount++;
                }
            });
            grid[i][j].mineCount = mineCount;
        }
    }
}

// Handle marking/unmarking mines
function handleLongPress(event) {
    event.preventDefault(); // Prevent default behavior
    const cell = event.target;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    if (isHellMode) {
        triggerExplosion(cell);
        return;
    }

    if (grid[row][col].isRevealed) return; // Already revealed cells are not processed

    // Toggle mark state
    if (cell.textContent === "🚩") {
        cell.textContent = ""; // Unmark
    } else {
        cell.textContent = "🚩"; // Mark
    }
}

function bindCellEvents(cell) {
    // Bind click event
    cell.addEventListener('click', handleCellClick);

    // Handle right-click for PC browsers
    cell.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        handleLongPress(event);
    });

    // Use pointer events for better cross-device compatibility
    cell.addEventListener('pointerdown', handlePointerDown, { passive: false });
    cell.addEventListener('pointerup', handlePointerUp, { passive: false });
    cell.addEventListener('pointercancel', handlePointerCancel, { passive: false });
    cell.addEventListener('pointermove', handlePointerMove, { passive: false });
}

function handlePointerDown(event) {
    event.preventDefault();
    const cell = event.target;
    cell.longPressTimeout = setTimeout(() => {
        handleLongPress(event);
    }, LONG_PRESS_DURATION);
}

function handlePointerUp(event) {
    const cell = event.target;
    if (cell.longPressTimeout) {
        clearTimeout(cell.longPressTimeout);
        cell.longPressTimeout = null;
    }
}

function handlePointerCancel(event) {
    const cell = event.target;
    if (cell.longPressTimeout) {
        clearTimeout(cell.longPressTimeout);
        cell.longPressTimeout = null;
    }
}

function handlePointerMove(event) {
    const cell = event.target;
    if (cell.longPressTimeout) {
        clearTimeout(cell.longPressTimeout);
        cell.longPressTimeout = null;
    }
}

function triggerExplosion(cell) {
    cell.textContent = "💣";
    cell.style.backgroundColor = "red";
    setTimeout(() => {
        alert("💥 You lost! Try again!");
        endGame(false);
    }, 100);
}

function handleCellClick(event) {
    const cell = event.target;

    // If the long press timeout is active, cancel it
    if (cell.longPressTimeout) {
        clearTimeout(cell.longPressTimeout);
        cell.longPressTimeout = null;
        return;
    }

    // In Hell Mode, any click triggers an explosion
    if (isHellMode) {
        triggerExplosion(cell);
        return;
    }

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    if (isFirstClick) {
        isFirstClick = false;

        if (rows === 1 && cols === 1) {
            // Hell Mode, place the only mine
            grid[0][0].isMine = true;
        } else {
            adjustMines(row, col); // Re-adjust mines after the first click
            calculateNumbers();
            revealSafeArea(row, col); // Reveal safe area
        }
    }

    if (grid[row][col].isRevealed || cell.textContent === "🚩") return;
    grid[row][col].isRevealed = true;

    if (grid[row][col].isMine) {
        cell.textContent = "💣";
        cell.style.backgroundColor = "red";

        setTimeout(() => {
            alert("💥 You lost! Try again!");
            endGame(false);
        }, 100);
    } else {
        const mineCount = grid[row][col].mineCount;
        cell.textContent = mineCount > 0 ? mineCount : "";
        cell.style.backgroundColor = "#ccc";

        if (mineCount === 0) revealAdjacentCells(row, col);
        checkWin();
    }
}

// Reveal safe area after the first click
function revealSafeArea(row, col) {
    if (rows === 1 && cols === 1) {
        // Hell Mode, no safe area to reveal
        return;
    }

    const queue = [[row, col]];
    const visited = new Set();

    while (queue.length > 0) {
        const [curRow, curCol] = queue.shift();
        if (visited.has(`${curRow},${curCol}`)) continue;
        visited.add(`${curRow},${curCol}`);

        const cell = document.querySelector(
            `.cell[data-row="${curRow}"][data-col="${curCol}"]`
        );

        if (!cell || grid[curRow][curCol].isMine || grid[curRow][curCol].isRevealed) {
            continue;
        }

        grid[curRow][curCol].isRevealed = true;
        const mineCount = grid[curRow][curCol].mineCount;
        cell.textContent = mineCount > 0 ? mineCount : "";
        cell.style.backgroundColor = "#ccc";

        if (mineCount === 0) {
            const directions = [
                [-1, -1], [-1, 0], [-1, 1],
                [0, -1],          [0, 1],
                [1, -1], [1, 0], [1, 1]
            ];
            directions.forEach(([dx, dy]) => {
                const newRow = curRow + dx;
                const newCol = curCol + dy;
                if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
                    queue.push([newRow, newCol]);
                }
            });
        }
    }
}

// Automatically reveal adjacent cells
function revealAdjacentCells(row, col) {
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],          [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];

    directions.forEach(([dx, dy]) => {
        const newRow = row + dx;
        const newCol = col + dy;
        if (
            newRow >= 0 && newRow < rows &&
            newCol >= 0 && newCol < cols &&
            !grid[newRow][newCol].isRevealed
        ) {
            const cell = document.querySelector(
                `.cell[data-row="${newRow}"][data-col="${newCol}"]`
            );
            handleCellClick({ target: cell });
        }
    });
}

// Check for a win
function checkWin() {
    let revealedCells = 0;
    let totalCells = rows * cols;

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (grid[i][j].isRevealed) revealedCells++;
        }
    }

    if (revealedCells === totalCells - mines) {
        alert("🎉 Congratulations, you won!");
        endGame(true);
    }
}

// End the game
function endGame(isWin) {
    const cells = document.querySelectorAll('.cell');
    cells.forEach((cell) => {
        cell.removeEventListener('click', handleCellClick);
        cell.removeEventListener('contextmenu', handleLongPress);
        cell.removeEventListener('pointerdown', handlePointerDown);
        cell.removeEventListener('pointerup', handlePointerUp);
        cell.removeEventListener('pointercancel', handlePointerCancel);
        cell.removeEventListener('pointermove', handlePointerMove);
    });
}

// Reset the game
function resetGame() {
    const difficulty = difficultySelect.value;

    // Adjust parameters based on difficulty
    if (difficulty === 'easy') {
        rows = 10;
        cols = 10;
        mines = 20;
        gameContainer.classList.remove('single-cell'); // Remove Hell Mode styling
        isHellMode = false;
    } else if (difficulty === 'medium') {
        rows = 20;
        cols = 20;
        mines = 80;
        gameContainer.classList.remove('single-cell');
        isHellMode = false;
    } else if (difficulty === 'hard') {
        rows = 30;
        cols = 30;
        mines = 200;
        gameContainer.classList.remove('single-cell');
        isHellMode = false;
    } else if (difficulty === 'hell') {
        rows = 1;
        cols = 1;
        mines = 1; // 1x1 Hell Mode, 100% chance of hitting a mine
        gameContainer.classList.add('single-cell'); // Add Hell Mode styling
        isHellMode = true;
    }

    // Clear the game container and grid data
    gameContainer.innerHTML = "";
    grid = [];
    isFirstClick = true;

    // Dynamically calculate cell size
    const maxContainerWidth = window.innerWidth - 40; // Account for margins
    const maxContainerHeight = window.innerHeight - 200; // Account for top and bottom space
    let cellSize = Math.floor(Math.min(maxContainerWidth / cols, maxContainerHeight / rows));

    // Set minimum cell size to avoid being too small
    if (cellSize < 15) cellSize = 15;

    // Set game container dimensions and grid template
    if (difficulty === 'hell') {
        // Special handling for Hell Mode
        gameContainer.style.width = `${cellSize}px`;
        gameContainer.style.height = `${cellSize}px`;
        gameContainer.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
        gameContainer.style.overflow = 'hidden'; // Disable scrolling
    } else {
        gameContainer.style.width = `${cellSize * cols}px`;
        gameContainer.style.height = `${cellSize * rows}px`;
        gameContainer.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
        gameContainer.style.overflow = 'auto'; // Enable scrolling
    }

    // Re-initialize the game
    initGame(cellSize);
}

// Initialize the game
function initGame(cellSize) {
    createGrid(cellSize);
    placeMines();
    calculateNumbers();
}

// Bind the reset button event
document.getElementById('restart-button').addEventListener('click', resetGame);

// Start the game
resetGame();
