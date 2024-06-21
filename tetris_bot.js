const { Client, GatewayIntentBits , EmbedBuilder } = require('discord.js');
const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildIntegrations,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.AutoModerationExecution,
      GatewayIntentBits.GuildIntegrations,
    ],
  });

let board = [];
const num_of_rows = 18;
const num_of_cols = 10;
const empty_square = ':black_large_square:';
const blue_square = ':blue_square:';
const brown_square = ':brown_square:';
const orange_square = ':orange_square:';
const yellow_square = ':yellow_square:';
const green_square = ':green_square:';
const purple_square = ':purple_square:';
const red_square = ':red_square:';
const embed_colour = 0x077ff7;
let points = 0;
let lines = 0;
let down_pressed = false;
let rotate_clockwise = false;
let rotation_pos = 0;
let h_movement = 0;
let is_new_shape = false;
let start_higher = false;
let game_over = false;
let index = 0;

class Tetronimo {
    constructor(starting_pos, colour, rotation_points) {
        this.starting_pos = starting_pos;
        this.colour = colour;
        this.rotation_points = rotation_points;
    }
}

const main_wall_kicks = [
    [[0, 0], [0, -1], [-1, -1], [2, 0], [2, -1]],
    [[0, 0], [0, 1], [1, 1], [-2, 0], [-2, 1]],
    [[0, 0], [0, 1], [-1, 1], [2, 0], [2, 1]],
    [[0, 0], [0, -1], [1, -1], [-2, 0], [-2, -1]]
];

const i_wall_kicks = [
    [[0, 0], [0, -2], [0, 1], [1, -2], [-2, 1]],
    [[0, 0], [0, -1], [0, 2], [-2, -1], [1, 2]],
    [[0, 0], [0, 2], [0, -1], [-1, 2], [2, -1]],
    [[0, 0], [0, 1], [0, -2], [2, 1], [-1, -2]]
];

const rot_adjustments = {
    ':blue_square:': [[0, 1], [-1, -1], [0, 0], [-1, 0]],
    ':brown_square:': [[0, 0], [0, 1], [0, 0], [0, -1]],
    ':orange_square:': [[0, -1], [0, 0], [-1, 1], [0, 0]],
    ':yellow_square:': [[0, 0], [0, 0], [0, 0], [0, 0]],
    ':green_square:': [[0, 0], [0, 0], [0, 0], [0, 0]],
    ':purple_square:': [[0, 0], [1, 1], [0, -1], [0, 1]],
    ':red_square:': [[1, -1], [-1, -1], [0, 2], [-1, -1]]
};

const shape_I = new Tetronimo([[0, 3], [0, 4], [0, 5], [0, 6]], blue_square, [1, 1, 1, 1]);
const shape_J = new Tetronimo([[0, 3], [0, 4], [0, 5], [-1, 3]], brown_square, [1, 1, 2, 2]);
const shape_L = new Tetronimo([[0, 3], [0, 4], [0, 5], [-1, 5]], orange_square, [1, 2, 2, 1]);
const shape_O = new Tetronimo([[0, 4], [0, 5], [-1, 4], [-1, 5]], yellow_square, [1, 1, 1, 1]);
const shape_S = new Tetronimo([[0, 3], [0, 4], [-1, 4], [-1, 5]], green_square, [2, 2, 2, 2]);
const shape_T = new Tetronimo([[0, 3], [0, 4], [0, 5], [-1, 4]], purple_square, [1, 1, 3, 0]);
const shape_Z = new Tetronimo([[0, 4], [0, 5], [-1, 3], [-1, 4]], red_square, [0, 1, 0, 2]);

function make_empty_board() {
    board = [];
    for (let row = 0; row < num_of_rows; row++) {
        let newRow = [];
        for (let col = 0; col < num_of_cols; col++) {
            newRow.push(empty_square);
        }
        board.push(newRow);
    }
}

function fill_board(emoji) {
    for (let row = 0; row < num_of_rows; row++) {
        for (let col = 0; col < num_of_cols; col++) {
            if (board[row][col] !== emoji) {
                board[row][col] = emoji;
            }
        }
    }
}

function format_board_as_str() {
    let board_as_str = '';
    for (let row = 0; row < num_of_rows; row++) {
        for (let col = 0; col < num_of_cols; col++) {
            board_as_str += board[row][col];
            if (col === num_of_cols - 1) {
                board_as_str += '\n';
            }
        }
    }
    return board_as_str;
}

function get_random_shape() {
    const shapes = [shape_I, shape_J, shape_L, shape_O, shape_S, shape_T, shape_Z];
    const random_shape = shapes[Math.floor(Math.random() * shapes.length)];
    const new_shape = {
        starting_pos: random_shape.starting_pos.map(pos => [...pos]),
        colour: random_shape.colour,
        rotation_points: [...random_shape.rotation_points]
    };
    if (start_higher) {
        new_shape.starting_pos.forEach(pos => pos[0] -= 1);
    }
    is_new_shape = true;
    return new_shape;
}

function do_wall_kicks(shape, old_shape_pos, shape_colour, attempt_kick_num) {
    let new_shape_pos = [];
    const kick_set = shape_colour === blue_square ? main_wall_kicks[rotation_pos] : i_wall_kicks[rotation_pos];

    for (const kick of kick_set) {
        for (const square of shape) {
            const [square_row, square_col] = square;
            const new_square_row = square_row + kick[0];
            const new_square_col = square_col + kick[1];

            if (0 <= new_square_col && new_square_col < num_of_cols && 0 <= new_square_row && new_square_row < num_of_rows) {
                const square_checking = board[new_square_row][new_square_col];
                if (square_checking !== empty_square && !old_shape_pos.some(pos => pos[0] === new_square_row && pos[1] === new_square_col)) {
                    new_shape_pos = [];
                    break;
                } else {
                    new_shape_pos.push([new_square_row, new_square_col]);
                    if (new_shape_pos.length === 4) {
                        return new_shape_pos;
                    }
                }
            } else {
                new_shape_pos = [];
                break;
            }
        }
    }
    return old_shape_pos;
}

function rotate_shape(shape, direction, rotation_point_index, shape_colour) {
    const rotation_point = shape[rotation_point_index];
    let new_shape = [];

    shape.forEach(square => {
        const [square_row, square_col] = square;
        let new_square_row, new_square_col;
        if (direction === 'clockwise') {
            new_square_row = (square_col - rotation_point[1]) + rotation_point[0] + rot_adjustments[shape_colour][rotation_pos - 1][0];
            new_square_col = -(square_row - rotation_point[0]) + rotation_point[1] + rot_adjustments[shape_colour][rotation_pos - 1][1];
        } else {
            new_square_row = -(square_col - rotation_point[1]) + rotation_point[0];
            new_square_col = (square_row - rotation_point[0]) + rotation_point[1];
        }
        new_shape.push([new_square_row, new_square_col]);
        if (0 <= square_col && square_col < num_of_cols && 0 <= square_row && square_row < num_of_rows) {
            board[square_row][square_col] = empty_square;
        }
    });

    new_shape = do_wall_kicks(new_shape, shape, shape_colour, 0);
    new_shape.sort((a, b) => b[0] - a[0]);

    if (JSON.stringify(new_shape) !== JSON.stringify(shape)) {
        new_shape.forEach(square => {
            const [square_row, square_col] = square;
            board[square_row][square_col] = shape_colour;
        });
    }

    return new_shape;
}

function clear_lines() {
    let lines_to_clear = 0;

    for (let row = 0; row < num_of_rows; row++) {
        let row_full = true;

        for (let col = 0; col < num_of_cols; col++) {
            if (board[row][col] === empty_square) {
                row_full = false;
                break;
            }
        }

        if (row_full) {
            lines_to_clear++;
            for (let r = row; r > 0; r--) {
                for (let c = 0; c < num_of_cols; c++) {
                    board[r][c] = board[r - 1][c];
                }
            }
            for (let c = 0; c < num_of_cols; c++) {
                board[0][c] = empty_square;
            }
        }
    }

    switch (lines_to_clear) {
        case 1:
            points += 100;
            lines += 1;
            break;
        case 2:
            points += 300;
            lines += 2;
            break;
        case 3:
            points += 500;
            lines += 3;
            break;
        case 4:
            points += 800;
            lines += 4;
            break;
    }
}

function get_next_pos(cur_shape_pos) {
    let movement_amnt = 1;
    const amnt_to_check = down_pressed ? num_of_rows : 1;

    for (let i = 0; i < amnt_to_check; i++) {
        let next_space_free = true;

        for (const square of cur_shape_pos) {
            const [square_row, square_col] = square;

            if (0 <= square_col && square_col < num_of_cols) {
                if (!(0 <= square_col + h_movement && square_col + h_movement < num_of_cols)) {
                    h_movement = 0;
                }
                if (0 <= square_row + movement_amnt && square_row + movement_amnt < num_of_rows) {
                    const square_checking = board[square_row + movement_amnt][square_col + h_movement];
                    if (square_checking !== empty_square && !cur_shape_pos.some(pos => pos[0] === square_row + movement_amnt && pos[1] === square_col + h_movement)) {
                        h_movement = 0;
                        if (movement_amnt === 1) {
                            next_space_free = false;
                            if (is_new_shape) {
                                if (start_higher) {
                                    game_over = true;
                                } else {
                                    start_higher = true;
                                }
                            }
                        } else if (movement_amnt > 1) {
                            movement_amnt--;
                        }
                        return [movement_amnt, next_space_free];
                    } else if (down_pressed) {
                        movement_amnt++;
                    }
                } else if (square_row + movement_amnt >= num_of_rows) {
                    if (movement_amnt === 1) {
                        next_space_free = false;
                    } else if (movement_amnt > 1) {
                        movement_amnt--;
                    }
                    return [movement_amnt, next_space_free];
                } else if (down_pressed) {
                    movement_amnt++;
                }
            }
        }
    }

    return [movement_amnt, true];
}

async function run_game(msg, cur_shape) {
    const cur_shape_pos = cur_shape.starting_pos;
    const cur_shape_colour = cur_shape.colour;

    if (rotate_clockwise && cur_shape_colour !== yellow_square) {
        cur_shape.starting_pos = rotate_shape(cur_shape_pos, 'clockwise', cur_shape.rotation_points[rotation_pos], cur_shape_colour);
    }

    const [movement_amnt, next_space_free] = get_next_pos(cur_shape_pos);

    if (next_space_free) {
        cur_shape_pos.forEach((square, i) => {
            const [square_row, square_col] = square;

            if (0 <= square_row + movement_amnt && square_row + movement_amnt < num_of_rows) {
                board[square_row + movement_amnt][square_col + h_movement] = cur_shape_colour;

                if (is_new_shape) {
                    is_new_shape = false;
                }

                if (square_row > -1) {
                    board[square_row][square_col] = empty_square;
                }

                cur_shape_pos[i] = [square_row + movement_amnt, square_col + h_movement];
            } else {
                cur_shape_pos[i] = [square_row + movement_amnt, square_col + h_movement];
            }
        });
    } else {
        down_pressed = false;
        clear_lines();
        const new_shape = get_random_shape();
        rotation_pos = 0;
        await run_game(msg, new_shape);
        return;
    }

    if (!game_over) {
        const embed = new EmbedBuilder().setDescription(format_board_as_str()).setColor(embed_colour);
        h_movement = 0;
        rotate_clockwise = false;
        await msg.edit({ embeds: [embed] });
        if (!is_new_shape) {
            setTimeout(() => run_game(msg, cur_shape), 1000);
        } else {
            await run_game(msg, cur_shape);
        }
    } else {
        const desc = `Score: ${points} \n Lines: ${lines} \n \n Press ▶ to play again.`;
        const embed = new MessageEmbed().setTitle('GAME OVER').setDescription(desc).setColor(embed_colour);
        await msg.edit({ embeds: [embed] });
    }
}

async function reset_game() {
    make_empty_board(); // Ensure board is initialized
    fill_board(empty_square);
    down_pressed = false;
    rotate_clockwise = false;
    rotation_pos = 0;
    h_movement = 0;
    is_new_shape = false;
    start_higher = false;
    game_over = false;
    points = 0;
    lines = 0;
}

client.once('ready', () => {
    console.log('Tetris bot started');
});

client.on('messageCreate', async (message) => {
    if (message.content === 't!test') {
        await message.channel.send('Test working');
    } else if (message.content === 't!start') {
        await reset_game();
        const embed = new EmbedBuilder()
            .setColor(embed_colour)
            .setTitle('Tetris in Discord')
            .setDescription(format_board_as_str())
            .addFields([
                { name: 'How to Play:', value: 'Use ⬅ ⬇ ➡ to move left, down, and right respectively. \n  \n Use 🔃 to rotate the shape clockwise. \n \n Press ▶ to Play.' }
            ]);

        const msg = await message.channel.send({ embeds: [embed] });
        await msg.react('▶');
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;

    const msg = reaction.message;
    const emoji = reaction.emoji.name;

    if (emoji === '▶') {
        await reset_game();
        const embed = new EmbedBuilder().setDescription(format_board_as_str()).setColor(embed_colour);
        await msg.edit({ embeds: [embed] });
        await msg.reactions.removeAll();
        await msg.react('⬅');
        await msg.react('⬇');
        await msg.react('➡');
        await msg.react('🔃');
        await msg.react('❌');
        const starting_shape = get_random_shape();
        await run_game(msg, starting_shape);
    } else if (emoji === '⬅') {
        h_movement = -1;
        await reaction.users.remove(user);
    } else if (emoji === '➡') {
        h_movement = 1;
        await reaction.users.remove(user);
    } else if (emoji === '⬇') {
        down_pressed = true;
        await reaction.users.remove(user);
    } else if (emoji === '🔃') {
        rotate_clockwise = true;
        rotation_pos = (rotation_pos + 1) % 4;
        await reaction.users.remove(user);
    } else if (emoji === '❌') {
        await reset_game();
        await msg.delete();
    }
});

client.login('token here');
