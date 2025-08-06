
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

    const BOARD_SIZE = 19;
    const CELL_SIZE = canvas.width / (BOARD_SIZE + 1);
    const PADDING = CELL_SIZE;

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
    }

    function drawStone(x, y, color) {
        const stoneRadius = CELL_SIZE / 2.2;
        ctx.beginPath();
        ctx.arc(
            PADDING + x * CELL_SIZE,
            PADDING + y * CELL_SIZE,
            stoneRadius,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = color;
        ctx.fill();
    }

    // 모달 표시 함수
    function showResultModal(message) {
        resultMessage.textContent = message;
        
        // 승자에 따라 제목과 스타일 변경
        if (message.includes('Black wins')) {
            resultTitle.textContent = '흑돌 승리! 🎉';
            resultTitle.style.color = '#000';
        } else if (message.includes('White wins')) {
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
        drawBoard();
        for (let y = 0; y < data.board.length; y++) {
            for (let x = 0; x < data.board[y].length; x++) {
                if (data.board[y][x]) {
                    drawStone(x, y, data.board[y][x]);
                }
            }
        }
        if (data.message.includes('wins')) {
            // alert 대신 모달 사용
            showResultModal(data.message);
        }
    };

    canvas.addEventListener('click', (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const gridX = Math.round((x - PADDING) / CELL_SIZE);
        const gridY = Math.round((y - PADDING) / CELL_SIZE);

        if (gridX >= 0 && gridX < BOARD_SIZE && gridY >= 0 && gridY < BOARD_SIZE) {
            socket.send(JSON.stringify({ x: gridX, y: gridY }));
        }
    });

    drawBoard();
});
