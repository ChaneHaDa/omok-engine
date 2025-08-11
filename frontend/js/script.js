
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('omok-board');
    const ctx = canvas.getContext('2d');
    const socket = new WebSocket('ws://localhost:8000/ws');

    // 모달 요소들
    const modal = document.getElementById('result-modal');
    const resultTitle = document.getElementById('result-title');
    const resultMessage = document.getElementById('result-message');
    const newGameBtn = document.getElementById('new-game-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    
    // 게임 정보 요소들
    const currentTurnElement = document.getElementById('current-turn');
    const moveCountElement = document.getElementById('move-count');

    const BOARD_SIZE = 19;
    const CELL_SIZE = canvas.width / (BOARD_SIZE + 1);
    const PADDING = CELL_SIZE;
    
    // 게임 상태 추적
    let gameEnded = false;
    let playerColor = null; // 'black' or 'white'
    let currentTurn = null;
    let currentBoard = [];
    let currentMoveNumbers = [];
    let lastMove = null;
    let hoverPosition = null;

    function drawBoard() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;

        for (let i = 0; i < BOARD_SIZE; i++) {
            ctx.beginPath();
            ctx.moveTo(PADDING + i * CELL_SIZE, PADDING);
            ctx.lineTo(PADDING + i * CELL_SIZE, canvas.height - PADDING);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(PADDING, PADDING + i * CELL_SIZE);
            ctx.lineTo(canvas.width - PADDING, PADDING + i * CELL_SIZE);
            ctx.stroke();
        }
        
        // 저장된 보드 상태가 있으면 다시 그리기
        if (currentBoard.length > 0) {
            console.log('Drawing board with gameEnded:', gameEnded);
            for (let y = 0; y < currentBoard.length; y++) {
                for (let x = 0; x < currentBoard[y].length; x++) {
                    if (currentBoard[y][x]) {
                        const moveNumber = currentMoveNumbers[y] ? currentMoveNumbers[y][x] : null;
                        const isLastMove = lastMove && lastMove.x === x && lastMove.y === y;
                        console.log(`Drawing stone at (${x}, ${y}): ${currentBoard[y][x]}, moveNumber: ${moveNumber}, showNumbers: ${gameEnded}`);
                        drawStone(x, y, currentBoard[y][x], moveNumber, gameEnded, isLastMove);
                    }
                }
            }
        }
        
        // 호버 프리뷰 그리기
        if (hoverPosition && !gameEnded && playerColor && currentTurn === playerColor) {
            drawHoverPreview(hoverPosition.x, hoverPosition.y);
        }
    }
    
    function drawHoverPreview(x, y) {
        // 이미 돌이 있는 곳은 프리뷰 안함
        if (currentBoard && currentBoard.length && currentBoard[y] && currentBoard[y][x]) {
            return;
        }
        
        const stoneRadius = CELL_SIZE / 2.2;
        const centerX = PADDING + x * CELL_SIZE;
        const centerY = PADDING + y * CELL_SIZE;
        
        // 투명한 돌 그리기
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(centerX, centerY, stoneRadius, 0, Math.PI * 2);
        ctx.fillStyle = playerColor;
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }

    function drawStone(x, y, color, moveNumber = null, showNumbers = false, isLastMove = false) {
        const stoneRadius = CELL_SIZE / 2.2;
        const centerX = PADDING + x * CELL_SIZE;
        const centerY = PADDING + y * CELL_SIZE;
        
        // 마지막 수 하이라이트
        if (isLastMove && !showNumbers) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, stoneRadius + 4, 0, Math.PI * 2);
            ctx.strokeStyle = color === 'black' ? '#ff6b6b' : '#4dabf7';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        
        // 돌 그리기
        ctx.beginPath();
        ctx.arc(centerX, centerY, stoneRadius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        
        // 돌 테두리
        ctx.beginPath();
        ctx.arc(centerX, centerY, stoneRadius, 0, Math.PI * 2);
        ctx.strokeStyle = color === 'black' ? '#333' : '#ccc';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 게임이 끝났을 때만 차례 번호 표시
        console.log(`drawStone called: x=${x}, y=${y}, color=${color}, moveNumber=${moveNumber}, showNumbers=${showNumbers}`);
        if (showNumbers && moveNumber && moveNumber > 0) {
            console.log(`Drawing number ${moveNumber} on stone at (${x}, ${y})`);
            ctx.fillStyle = color === 'black' ? 'white' : 'black';
            ctx.font = `${Math.max(10, CELL_SIZE / 4)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(moveNumber.toString(), centerX, centerY);
        }
    }

    // 모달 표시 함수
    function showResultModal(message) {
        resultMessage.textContent = message;
        
        // 승자에 따라 제목과 스타일 변경
        if (message.includes('black wins')) {
            resultTitle.textContent = '흑돌 승리! 🎉';
            resultTitle.style.color = '#000';
        } else if (message.includes('white wins')) {
            resultTitle.textContent = '백돌 승리! 🎉';
            resultTitle.style.color = '#fff';
        } else {
            resultTitle.textContent = '게임 결과';
        }
        
        modal.style.display = 'block';
        
        // 모달이 표시된 후 배경 클릭 방지
        document.body.style.overflow = 'hidden';
    }

    // 모달 숨기기 함수
    function hideResultModal() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // 새 게임 시작 함수
    function startNewGame() {
        hideResultModal();
        gameEnded = false;
        currentBoard = [];
        currentMoveNumbers = [];
        playerColor = null;
        currentTurn = null;
        lastMove = null;
        hoverPosition = null;
        drawBoard();
        // 서버에 새 게임 요청을 보낼 수 있습니다
        socket.send(JSON.stringify({ action: 'new_game' }));
    }

    // 모달 이벤트 리스너들
    newGameBtn.addEventListener('click', startNewGame);
    closeModalBtn.addEventListener('click', hideResultModal);
    
    // 모달 외부 클릭시 닫기
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            hideResultModal();
        }
    });

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            hideResultModal();
        }
    });

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        // 디버깅용 로그
        console.log('Received data:', data);
        console.log('Game ended:', gameEnded);
        console.log('Move numbers:', data.move_numbers);
        
        // 보드 상태 저장
        currentBoard = data.board;
        currentMoveNumbers = data.move_numbers || [];

        // 마지막 수 추적 (봇 수인 경우)
        if (data.bot_move) {
            lastMove = { x: data.bot_move.x, y: data.bot_move.y };
        }

        // 플레이어 색상 할당 (새 게임 시작 시 제공)
        if (data.player_color) {
            playerColor = data.player_color;
            console.log('Assigned player color:', playerColor);
        }
        
        // 게임이 끝났는지 확인
        if (data.message.includes('wins')) {
            gameEnded = true;
            console.log('Game ended! Showing numbers...');
            showResultModal(data.message);
            // 게임이 끝났을 때는 잠시 후에 다시 그리기 (모달이 표시된 후)
            setTimeout(() => {
                console.log('Redrawing board after game end...');
                drawBoard();
            }, 100);
        } else {
            drawBoard();
        }
        
        // 게임 정보 업데이트
        if (data.current_turn) {
            currentTurn = data.current_turn;
            const turnName = data.current_turn === 'black' ? '흑돌' : '백돌';
            const stoneClass = data.current_turn === 'black' ? 'black' : 'white';
            const valueSpan = currentTurnElement.querySelector('.value');
            if (valueSpan) {
                valueSpan.innerHTML = `<span class="stone-icon ${stoneClass}"></span>${turnName}`;
            }
        }
        if (data.move_count !== undefined) {
            const valueSpan = moveCountElement.querySelector('.value');
            if (valueSpan) {
                valueSpan.textContent = data.move_count;
            }
        }
    };

    canvas.addEventListener('click', (event) => {
        if (gameEnded) {
            console.log('Game ended; click ignored.');
            return;
        }
        if (playerColor && currentTurn && currentTurn !== playerColor) {
            console.log('Not your turn; click ignored.');
            return;
        }
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const gridX = Math.round((x - PADDING) / CELL_SIZE);
        const gridY = Math.round((y - PADDING) / CELL_SIZE);

        if (gridX >= 0 && gridX < BOARD_SIZE && gridY >= 0 && gridY < BOARD_SIZE) {
            // 이미 돌이 놓인 자리 클릭 무시 (클라이언트 측 예방)
            if (currentBoard && currentBoard.length && currentBoard[gridY] && currentBoard[gridY][gridX]) {
                console.log('Cell occupied; click ignored.');
                return;
            }
            // 플레이어 수를 마지막 수로 설정
            lastMove = { x: gridX, y: gridY };
            socket.send(JSON.stringify({ x: gridX, y: gridY }));
        }
    });
    
    // 마우스 호버 이벤트
    canvas.addEventListener('mousemove', (event) => {
        if (gameEnded || !playerColor || currentTurn !== playerColor) {
            hoverPosition = null;
            drawBoard();
            return;
        }
        
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const gridX = Math.round((x - PADDING) / CELL_SIZE);
        const gridY = Math.round((y - PADDING) / CELL_SIZE);

        if (gridX >= 0 && gridX < BOARD_SIZE && gridY >= 0 && gridY < BOARD_SIZE) {
            hoverPosition = { x: gridX, y: gridY };
        } else {
            hoverPosition = null;
        }
        drawBoard();
    });
    
    // 마우스가 캔버스를 벗어날 때 호버 제거
    canvas.addEventListener('mouseleave', () => {
        hoverPosition = null;
        drawBoard();
    });

    drawBoard();
});
