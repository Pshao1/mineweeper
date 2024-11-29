let rows = 10; // 默认行数
let cols = 10; // 默认列数
let mines = 20; // 默认地雷数量
let isFirstClick = true; // 标志是否是第一次点击
let grid = []; // 网格数据
let isHellMode = false; // 是否是地狱模式

const gameContainer = document.getElementById('game-container');
const difficultySelect = document.getElementById('difficulty');

let longPressTimeout = null; // 用于判断长按
const LONG_PRESS_DURATION = 500; // 长按时间（毫秒）

// 创建网格
function createGrid(cellSize) {

    cell.style.userSelect = 'none'; // 禁止用户选择文本
    cell.style.webkitUserSelect = 'none'; // 兼容 Safari

    // 清空游戏容器和网格数据
    gameContainer.innerHTML = "";
    grid = [];

    for (let i = 0; i < rows; i++) {
        let rowArray = [];
        for (let j = 0; j < cols; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = i;
            cell.dataset.col = j;

            // 设置单元格的尺寸和样式
            cell.style.width = `${cellSize}px`;
            cell.style.height = `${cellSize}px`;
            cell.style.lineHeight = `${cellSize}px`; // 使内容垂直居中
            cell.style.fontSize = `${Math.max(cellSize * 0.4, 12)}px`; // 字体大小，最小 12px

            // 绑定事件监听
            bindCellEvents(cell);

            // 将单元格添加到容器
            gameContainer.appendChild(cell);

            // 初始化网格数据
            rowArray.push({ isMine: false, isRevealed: false, mineCount: 0 });
        }
        grid.push(rowArray);
    }
}

// 随机布置地雷
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

// 调整地雷布局，确保初次点击和其周围区域安全
function adjustMines(excludeRow, excludeCol) {
    if (rows === 1 && cols === 1) {
        // 地狱模式，直接布置唯一的地雷
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

// 计算每个格子周围的地雷数量
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

// 长按事件处理（标记地雷）
function handleLongPress(event) {
    event.preventDefault(); // 阻止默认行为（如上下文菜单）
    const cell = event.target;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    if (isHellMode) {
        triggerExplosion(cell);
        return;
    }

    if (grid[row][col].isRevealed) return; // 已经被揭开的格子不处理

    // 切换标记状态
    if (cell.textContent === "🚩") {
        cell.textContent = ""; // 取消标记
    } else {
        cell.textContent = "🚩"; // 添加标记
    }
}

function bindCellEvents(cell) {
    let cellLongPressTimeout = null; // 用于检测长按事件

    // 监听单击事件
    cell.addEventListener('click', handleCellClick);

    // 监听右键事件（防止误触）
    cell.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    });

    cell.addEventListener('touchstart', (event) => {
        event.preventDefault(); // 阻止默认行为，防止弹出菜单
        cellLongPressTimeout = setTimeout(() => {
            handleLongPress(event);
        }, LONG_PRESS_DURATION);
    });

    // 移动端触摸结束，清除长按检测
    cell.addEventListener('touchend', () => {
        event.preventDefault();
        if (cellLongPressTimeout) {
            clearTimeout(cellLongPressTimeout);
            cellLongPressTimeout = null;
        }
    });
    // 阻止 iOS 上的触摸长按菜单
cell.addEventListener('touchmove', (event) => {
    event.preventDefault();
});
}

function triggerExplosion(cell) {
    cell.textContent = "💣";
    cell.style.backgroundColor = "red";
    setTimeout(() => {
        alert("💥 菜，就多练！！");
        endGame(false);
    }, 100);
}

function handleCellClick(event) {
    const cell = event.target;

    // 在地狱模式下，无论点击什么都爆炸
    if (isHellMode) {
        triggerExplosion(cell);
        return;
    }

    // 避免长按时触发普通点击
    if (cell.longPressTimeout) {
        clearTimeout(cell.longPressTimeout);
        cell.longPressTimeout = null;
        return;
    }

    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    if (isFirstClick) {
        isFirstClick = false;

        if (rows === 1 && cols === 1) {
            // 地狱模式，直接布置唯一的地雷
            grid[0][0].isMine = true;
        } else {
            adjustMines(row, col); // 第一次点击重新布置地雷
            calculateNumbers();
            revealSafeArea(row, col); // 排除安全区域
        }
    }

    if (grid[row][col].isRevealed || cell.textContent === "🚩") return;
    grid[row][col].isRevealed = true;

    if (grid[row][col].isMine) {
        cell.textContent = "💣";
        cell.style.backgroundColor = "red";

        setTimeout(() => {
            alert("💥 菜，就多练！！");
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

// 排除初次点击后的安全区域
function revealSafeArea(row, col) {
    if (rows === 1 && cols === 1) {
        // 地狱模式，不进行安全区域排除
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

// 自动翻开周围格子
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

// 检查是否胜利
function checkWin() {
    let revealedCells = 0;
    let totalCells = rows * cols;

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (grid[i][j].isRevealed) revealedCells++;
        }
    }

    if (revealedCells === totalCells - mines) {
        alert("🎉 呦，有点东西！！");
        endGame(true);
    }
}

// 结束游戏
function endGame(isWin) {
    const cells = document.querySelectorAll('.cell');
    cells.forEach((cell) => {
        cell.removeEventListener('click', handleCellClick);
        cell.removeEventListener('contextmenu', handleLongPress);
        cell.removeEventListener('touchstart', handleLongPress);
        cell.removeEventListener('touchend', handleLongPress);
    });
}

// 重置游戏
function resetGame() {
    const difficulty = difficultySelect.value;

    // 根据难度调整参数
    if (difficulty === 'easy') {
        rows = 10;
        cols = 10;
        mines = 20;
        gameContainer.classList.remove('single-cell'); // 移除 Hell 模式样式
        isHellMode = false;
    } else if (difficulty === 'medium') {
        rows = 20;
        cols = 20;
        mines = 80;
        gameContainer.classList.remove('single-cell');
        isHellMode = false;
    } else if (difficulty === 'hard') {
        rows = 30; // 修改为 30x30 的网格
        cols = 30;
        mines = 200;
        gameContainer.classList.remove('single-cell');
        isHellMode = false;
    } else if (difficulty === 'hell') {
        rows = 1;
        cols = 1;
        mines = 1; // 1x1 的地狱模式，100% 中雷
        gameContainer.classList.add('single-cell'); // 添加 Hell 模式样式
        isHellMode = true;
    }

    // 清空游戏容器和网格数据
    gameContainer.innerHTML = "";
    grid = [];
    isFirstClick = true;

    // 动态计算单元格尺寸
    const maxContainerWidth = window.innerWidth - 40; // 考虑一些边距
    const maxContainerHeight = window.innerHeight - 200; // 考虑顶部和底部的空间
    let cellSize = Math.floor(Math.min(maxContainerWidth / cols, maxContainerHeight / rows));

    // 设置最小单元格尺寸，避免过小
    if (cellSize < 15) cellSize = 15;

    // 设置游戏容器的宽高和网格模板
    if (difficulty === 'hell') {
        // 特殊处理 Hell 模式
        gameContainer.style.width = `${cellSize}px`;
        gameContainer.style.height = `${cellSize}px`;
        gameContainer.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
        gameContainer.style.overflow = 'hidden'; // 禁止滚动
    } else {
        gameContainer.style.width = `${cellSize * cols}px`;
        gameContainer.style.height = `${cellSize * rows}px`;
        gameContainer.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
        gameContainer.style.overflow = 'auto'; // 可滚动
    }

    // 重新初始化游戏
    initGame(cellSize);
}

// 初始化游戏
function initGame(cellSize) {
    createGrid(cellSize);
    placeMines();
    calculateNumbers();
}

// 为按钮绑定事件
document.getElementById('restart-button').addEventListener('click', resetGame);

// 启动游戏
resetGame();
