
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('omok-board');
    const ctx = canvas.getContext('2d');
    const socket = new WebSocket('ws://localhost:8000/ws');

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
            alert(data.message);
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
