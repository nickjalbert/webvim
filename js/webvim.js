/*!
 * Wim v0.1 - Web based vim
 *
 * Author: Nick Jalbert (nickjalbert@gmail.com)
 *
 */

var vim_controller;
var vim_view;
var vim_model;


function ScreenPosition(x, y) {
    this.x = x;
    this.y = y;
}

function WebvimView() {
    this.span_start = '<spanid="cursor">'; 
    this.span_end = '</span>';

    this.refreshDisplay = function() {
        var mark_pos = vim_model.mark_position;
        var cursor_pos = vim_model.cursor_position;
        var text = vim_model.getText();
        var display = this.highlightPosition(mark_pos, cursor_pos, text);
        this.drawDisplay(display);
    }

    this.highlightPosition = function(start, cursor, text) {
        if (start.x == cursor.x && start.y == cursor.y) {
            return this.highlightCharAt(cursor, text);
        } else {
            return this.highlightLines(start, cursor, text);
        }
    }

    this.highlightCharAt = function(cursor, text) {
        if (cursor.x < text[cursor.y].length) {
            var front = text[cursor.y].substring(0, cursor.x);
            var target_char = text[cursor.y].charAt(cursor.x);
            var end = text[cursor.y].substring(cursor.x + 1);
            var highlight_char = this.span_start + target_char + this.span_end;
            text[cursor.y] = front + highlight_char + end;
            return text;
        } else if (cursor.x == text[cursor.y].length) {
            var highlight_char = this.span_start + "&nbsp;" + this.span_end;
            text[cursor.y] += highlight_char;
            return text;
        }
    }

    this.highlightLines = function(start, cursor, text) {
        alert("TODO: implement line highlighting");
    }

    this.drawDisplay = function(text) {
        var html_str = "";
        for (var i = 0; i < text.length; i++) {
            html_str += text[i];
            html_str += "<br/>";
        }
        html_str = html_str.split(' ').join("&nbsp;");
        /* TODO: can't type spanid in text anymore */
        html_str = html_str.replace("spanid", "span id");
        $("#webvim_text").html(html_str);
    }
}

function WebvimModel() {
    this.text = new Array();
    this.mark_position = new ScreenPosition(0, 0);
    this.cursor_position = new ScreenPosition(0, 0);

    this.initialize = function(start_text) {
        this.text[0] = start_text;
    }

    this.fixEmptyLines = function() {
        for (var i = 0; i < this.text.length; i++) {
            if (this.text[i].length == 0) {
                this.text[i] = " ";
            }
        }
    }

    this.addLine = function(text) {
        this.text[this.text.length] = text;
        this.fixEmptyLines();
    }

    this.getText = function() {
        return this.text.slice();
    }

    this.synchronizeMarkWithCursor = function() {
        this.mark_position.x = this.cursor_position.x;
        this.mark_position.y = this.cursor_position.y;
    }

    this.insertAtCurrentPosition = function(text) {
        var current_text = this.text[this.cursor_position.y];
        var pos_x = this.cursor_position.x;
        var front = current_text.substring(0, pos_x);
        var end = current_text.substring(pos_x);
        var result_text = front + text + end;
        this.text[this.cursor_position.y] = result_text;
        this.synchronizeMarkWithCursor();
    }

    this.cursorRight = function() {
        this.cursor_position.x += 1;
        this.makeCursorLegal();
    }

    this.cursorRightExtended = function() {
        this.cursor_position.x += 1;
        var line_len = this.text[this.cursor_position.y].length;
        if (this.cursor_position.x > line_len) {
            this.cursor_position.x = line_len;
        }
        this.synchronizeMarkWithCursor();
    }

    this.putCursorInBounds = function() {
        if (this.cursor_position.y < 0) {
            this.cursor_position.y = 0;
        }
        if (this.cursor_position.y >= this.text.length) {
            this.cursor_position.y = this.text.length - 1;
        }

        var line_len = this.text[this.cursor_position.y].length;
        if (this.cursor_position.x < 0) {
            this.cursor_position.x = 0;
        }
        if (this.cursor_position.x >= line_len) {
            this.cursor_position.x = line_len - 1;
        }
    }


    this.cursorLeft = function() {
        this.cursor_position.x -= 1;
        this.makeCursorLegal();
    }

    this.deleteCharAtCurrentPosition = function() {
        var current_text = this.text[this.cursor_position.y];
        var x_pos = this.cursor_position.x;
        var front = current_text.substring(0, x_pos);
        var end = current_text.substring(x_pos + 1);
        var result_text = front + end;
        this.text[this.cursor_position.y] = result_text;
        this.makeCursorLegal();
    }

    this.jumpToNextWord = function() {
        var current_text = this.text[this.cursor_position.y];
        var next_pos = current_text.indexOf(" ", this.cursor_position.x);
        if (next_pos == -1) {
            if (this.cursor_position.y + 1 < this.text.length) {
                this.cursor_position.y += 1;
                this.cursor_position.x = 0;
                this.jumpToNextWord();
            } else {
                this.endOfLine()
            }
            this.synchronizeMarkWithCursor();
            return;
        }
        next_pos += 1;
        this.cursor_position.x = next_pos;
        this.synchronizeMarkWithCursor();
    }

    this.jumpBackWord = function() {
        var current_text = this.text[this.cursor_position.y];
        var next_pos = current_text.lastIndexOf(" ",this.cursor_position.x-2);
        if (next_pos == -1) {
            if (this.cursor_position.y  > 0) {
                this.cursor_position.y -= 1;
                this.endOfLine();
                this.jumpBackWord();
            } else {
                this.startOfLine()
            }
            this.synchronizeMarkWithCursor();
            return;
        } else {
            next_pos += 1;
            this.cursor_position.x = next_pos;
        }
        this.synchronizeMarkWithCursor();
    }

    this.makeCursorLegal = function() {
        this.putCursorInBounds();
        this.synchronizeMarkWithCursor();
    }

    this.cursorUp = function() {
        this.cursor_position.y -= 1;
        this.makeCursorLegal();
    }

    this.cursorDown = function() {
        this.cursor_position.y += 1;
        this.makeCursorLegal();
    }

    this.endOfLine = function() {
        var current_text = this.text[this.cursor_position.y];
        this.cursor_position.x = current_text.length - 1;
        this.synchronizeMarkWithCursor();
    }

    this.startOfLine = function() {
        this.cursor_position.x = 0;
        this.synchronizeMarkWithCursor();
    }

    this.deleteCurrentLine = function() {
        if (this.text.length <= 1) {
            this.text[0] = " ";
        } else {
            this.text.splice(this.cursor_position.y, 1);
        }
        this.makeCursorLegal();
    }

    this.breakline = function() {
        var current_y = this.cursor_position.y;
        var current_text = this.text[current_y];
        var oldline_text = current_text.substring(0, this.cursor_position.x);
        var newline_text = current_text.substring(this.cursor_position.x);

        this.text[current_y] = oldline_text;
        this.text.splice(current_y + 1, 0, newline_text);

        this.cursor_position.x = 0;
        this.cursor_position.y = current_y + 1;
        this.fixEmptyLines();
        this.synchronizeMarkWithCursor();
    }

    this.backspace = function() {
        if (this.cursor_position.x == 0) {
            var current_y = this.cursor_position.y;
            if (current_y == 0) {
                return;
            }

            this.cursor_position.y = current_y - 1;
            this.cursor_position.x = this.text[this.cursor_position.y].length;
            this.text[this.cursor_position.y] += this.text[current_y];
            this.text.splice(current_y, 1);

        } else {
            this.cursorLeft();
            this.deleteCharAtCurrentPosition();
        }
        this.synchronizeMarkWithCursor();
    }



}

function WebvimController() {
    this.command_mode = true;
    this.command_string = "";

    this.keyAction = function(event) {
        if (this.keyIsEsc(event.which)) {
            this.command_mode = true;
            vim_model.makeCursorLegal();
            this.clearCommandString();
            vim_view.refreshDisplay();
            return;
        }

        if (this.command_mode) {
            this.handleCommandMode(event);
        } else {
            this.handleInsertMode(event);
        }
    }

    this.keyIsEsc = function(keycode) {
        if (keycode == 27 || keycode == 0) {
            return true;
        }
        return false;
    }

    this.handleInsertMode = function(event) {
        switch (event.which)
        {
            case 13:
                vim_model.breakline();
                break;

            case 8:
                event.preventDefault();
                vim_model.backspace();
                break;

            default:
                var typed_char = String.fromCharCode(event.which);
                vim_model.insertAtCurrentPosition(typed_char);
                vim_model.cursorRightExtended();
                break;
        }
        vim_view.refreshDisplay();
    }

    this.command_i = function() {
        this.command_mode = false;
    }

    this.command_l = function() {
        vim_model.cursorRight();
    }

    this.command_h = function() {
        vim_model.cursorLeft();
    }

    this.command_j = function() {
        vim_model.cursorDown();
    }

    this.command_k = function() {
        vim_model.cursorUp();
    }

    this.command_a = function() {
        vim_model.cursorRightExtended();
        this.command_mode = false;
    }

    this.command_$ = function() {
        vim_model.endOfLine();
    }

    this.command_x = function() {
        vim_model.deleteCharAtCurrentPosition();
    }

    this.command_w = function() {
        vim_model.jumpToNextWord();
    }

    this.command_b = function() {
        vim_model.jumpBackWord();
    }

    this.command_0 = function() {
        vim_model.startOfLine();
    }

    this.command_dd = function() {
        vim_model.deleteCurrentLine();
    }

    this.handleCommandMode = function(event) {
        var typed_key = String.fromCharCode(event.which);
        this.addCommandString(typed_key);
        method_name = this.generateCommandMethod();
        if (this.hasOwnProperty(method_name)) {
            this[method_name]();
            this.clearCommandString()
        }
        vim_view.refreshDisplay();
    }

    this.addCommandString = function(typed_key) {
        this.command_string += typed_key;
    }

    this.clearCommandString = function() {
        this.command_string = "";
    }

    this.generateCommandMethod = function() {
        return "command_" + this.command_string;
    }
}

$(document).ready(function(event) {
        vim_controller = new WebvimController();
        vim_model = new WebvimModel();
        vim_view = new WebvimView();


        vim_model.initialize("this is test text");
        vim_model.addLine("this is more text text");
        vim_view.refreshDisplay();

        $("#webvim_title").text("webvim: A JavaScript Vim Emulator");

        $(window).keypress(function(event) {
            vim_controller.keyAction(event);
            });
        });
