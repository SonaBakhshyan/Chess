const gameboard = document.querySelector("#gameboard");
const playerDisplay = document.querySelector("#player");
const infoDisplay = document.querySelector("#info-display");
const width = 8;

let playerGo = 'black';
playerDisplay.textContent = playerGo;

// Mapping pieces names to their HTML from pieces.js
const piecesMap = { king, queen, rook, bishop, knight, pawn };

// create the starting stones with Loop
const pieceOrder = [ 'rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook' ];
const startPieces = [];

for (let i = 0; i < 64; i++) {
    if (i < 8) startPieces.push(pieceOrder[i]);
    else if (i >= 8 && i < 16) startPieces.push('pawn');
    else if (i >= 48 && i < 56) startPieces.push('pawn');
    else if (i >= 56) startPieces.push(pieceOrder[i - 56]);
    else startPieces.push('');
}

function createBoard() {
    startPieces.forEach((startPiece, i) => {
        const square = document.createElement('div');
        square.classList.add('square');
        square.setAttribute('square-id', i);

        // Checkerboard colors
        const row = Math.floor((63 - i) / 8) + 1;
        if (row % 2 === 0) square.classList.add(i % 2 === 0 ? "beige" : "brown");
        else square.classList.add(i % 2 === 0 ? "brown" : "beige");

        // Add piece if exists
        if (startPiece) {
            square.innerHTML = piecesMap[startPiece];
            const pieceDiv = square.firstChild;
            pieceDiv.setAttribute('draggable', true);
            pieceDiv.classList.add(i < 16 ? 'black' : i >= 48 ? 'white' : '');
        }

        gameboard.appendChild(square);
    });
}

createBoard();

const allSquares = document.querySelectorAll(".square");
let startPositionId;
let draggedElement;

// Add drag event listeners
allSquares.forEach(square => {
    square.addEventListener('dragstart', dragStart);
    square.addEventListener('dragover', dragOver);
    square.addEventListener('drop', dragDrop);
});

function dragStart(e) {
    startPositionId = e.target.parentNode.getAttribute('square-id');
    draggedElement = e.target;
}

function dragOver(e) { e.preventDefault(); }

function dragDrop(e) {
    e.stopPropagation();

    const correctGo = draggedElement.classList.contains(playerGo);
    if (!correctGo) return;

    const valid = checkIfValid(e.target);
    if (!valid) {
        infoDisplay.textContent = "You cannot go here!";
        setTimeout(() => infoDisplay.textContent = "", 2000);
        return;
    }

    // Capture if needed
    if (e.target.firstChild) e.target.firstChild.remove();
    e.target.appendChild(draggedElement);

    if (isCheck(playerGo)) {
        infoDisplay.textContent = `${playerGo} is in check!`;
        setTimeout(() => infoDisplay.textContent = "", 2000);
    }

    checkForWin();
    changePlayer();
}

// Main movement logic
function checkIfValid(target) {
    const startId = Number(startPositionId);
    const targetId = Number(target.getAttribute('square-id'));
    const piece = draggedElement.id;

    switch (piece) {
        case 'pawn':
            return checkPawn(startId, targetId);
        case 'knight':
            return checkKnight(startId, targetId);
        case 'bishop':
            return checkBishop(startId, targetId);
        case 'rook':
            return checkRook(startId, targetId);
        case 'queen':
            return checkRook(startId, targetId) || checkBishop(startId, targetId);
        case 'king':
            return checkKing(startId, targetId);
    }
    return false;
}

// Pawn movement
function checkPawn(startId, targetId) {
    const direction = draggedElement.classList.contains('white') ? -1 : 1;
    const startRow = Math.floor(startId / width);
    const targetSquare = allSquares[targetId];

    // Forward move
    if (startId + width*direction === targetId && !targetSquare.firstChild) return true;

    // Double move from starting row
    if (startId + width*2*direction === targetId &&
        ((draggedElement.classList.contains('white') && startRow === 6) ||
         (draggedElement.classList.contains('black') && startRow === 1)) &&
        !targetSquare.firstChild) return true;

    // Capture diagonally
    if ((startId + width*direction -1 === targetId || startId + width*direction +1 === targetId) &&
        targetSquare.firstChild &&
        !targetSquare.firstChild.classList.contains(playerGo)) return true;

    return false;
}

// Knight movement
function checkKnight(startId, targetId) {
    const moves = [1 + 2*width, -1 + 2*width, 1 - 2*width, -1 - 2*width,
                   2 + width, -2 + width, 2 - width, -2 - width];
    return moves.some(m => startId + m === targetId);
}

// Bishop movement
function checkBishop(startId, targetId) {
    const directions = [width+1, width-1, -width+1, -width-1];
    return checkLine(startId, targetId, directions);
}

// Rook movement
function checkRook(startId, targetId) {
    const directions = [1, -1, width, -width];
    return checkLine(startId, targetId, directions);
}

// King movement
function checkKing(startId, targetId) {
    const moves = [-1,1,-width,width,-width-1,-width+1,width-1,width+1];
    return moves.includes(targetId - startId);
}

// General line checking for rook & bishop
function checkLine(startId, targetId, directions) {
    for (let d of directions) {
        let pos = startId + d;
        while (pos >= 0 && pos < 64 && !isBlocked(startId,pos,d)) {
            if (pos === targetId) return true;
            pos += d;
        }
        if (pos === targetId) return true;
    }
    return false;
}

// Block detection for rook & bishop
function isBlocked(startId,pos,direction) {
    const startRow = Math.floor(startId/width);
    const posRow = Math.floor(pos/width);

    // Detect row overflow for horizontal/diagonal moves
    if (Math.abs(direction) === 1 || Math.abs(direction) === width+1 || Math.abs(direction) === width-1) {
        if (Math.abs(posRow-startRow) !== Math.abs((pos-startId)/width)) return true;
    }

    // If square has piece, block
    return allSquares[pos].firstChild ? true : false;
}

// Check detection
function isCheck(color) {
    const king = [...document.querySelectorAll(`.piece.${color}`)].find(p => p.id === 'king');
    if (!king) return false;
    const kingSquare = king.parentNode;
    const opponentColor = color === 'white' ? 'black' : 'white';
    const opponentPieces = document.querySelectorAll(`.piece.${opponentColor}`);

    for (let op of opponentPieces) {
        draggedElement = op;
        startPositionId = op.parentNode.getAttribute('square-id');
        if (checkIfValid(kingSquare)) return true;
    }
    return false;
}

// Change player
function changePlayer() {
    playerGo = playerGo === 'black' ? 'white' : 'black';
    playerDisplay.textContent = playerGo;
}

// Win detection
function checkForWin() {
    const kings = Array.from(document.querySelectorAll('#king'));
    if(!kings.some(k => k.classList.contains('white'))) {
        infoDisplay.innerHTML = "Black player wins!";
        disableAll();
    }
    if(!kings.some(k => k.classList.contains('black'))) {
        infoDisplay.innerHTML = "White player wins!";
        disableAll();
    }
}

function disableAll() {
    const allSquares = document.querySelectorAll('.square');
    allSquares.forEach(square => square.firstChild?.setAttribute('draggable', false));
}
