import React, { Component } from 'react';
import { render }  from 'react-dom';
import update from 'immutability-helper';
import Grid from './Grid'

const KEY = {
    UP:  38,
    DOWN: 40,
    LEFT: 37,
    RIGHT: 39
};

const PI = 3.14159265359;

class Game extends Component {
    constructor(props) {
        super(props);

        this.state = {
            context: null,
            mapData: [],
            keys: {
                up: false,
                down: false,
                left: false,
                right: false
            },
            engine: {
                maxWidth: 640,
                maxHeight: 480,
                fieldOfVision: 90
            },
            grid: {
                gridSize: 10,
                gridOffsetX: 350,
                gridOffsetY: 305
            },
            player: {
                playerXpos: 0,
                playerYpos: 0,
                playerRotation: 0
            },
            gameStates: {
                init: false,
                title: false,
                start: false,
                map: false,
                end: false
            }
        };

        this.gridUnits = []; // do not put this in state or race condition imminent
        this.oldKeyState = this.state.keys; // todo: I dont like this
        this.debug = true;
    }

    // helper function to iterate over object and return them as key,value pairs
    mapObject(object, callback) {
        return Object.keys(object).map(function (key) {
            return callback(key, object[key]);
        });
    }

    // helper function to update a key, value pair inside state.gameStates
    updateGameState(key, value) {
        let newState = update(this.state, {
            gameStates: {
                [key]: { $set: value }
            }
        });

        this.setState(newState);

        if (this.debug){console.log('changed gameState for '+key+' to '+value)}
    }

    componentDidMount() {
        // add mapData that was received as props in constructor to the state
        let newState = Object.assign({}, this.state);
        newState['mapData'].push(this.props.mapData);
        this.setState(newState);

        // now that component is mounted the context of canvas element can be determined
        this.setState({ context: document.getElementById('canvas').getContext('2d') });
    }

    componentDidUpdate() {
        // since you cant call init() when the context has not been saved to the state, we need a check
        if (this.state.context != null && this.state.gameStates.init != true) {

            if(this.debug) {console.log('init game (for the first time)') }

            // register key event listeners
            window.addEventListener('keyup', this.handleKeys.bind(this, false));
            window.addEventListener('keydown', this.handleKeys.bind(this, true));

            // to complete init, set its gameState to true
            this.updateGameState('init', true);

            // draw title screen
            this.drawTitleScreen();
        }

        this.update(); // triggered when state changes outside of update() method, for example, a keypress or timer event
    }

    handleKeys(value, e){
        let keys = this.state.keys; // copy state
        if(e.keyCode === KEY.UP) keys.up = value; // mutate state
        if(e.keyCode === KEY.DOWN) keys.down = value;
        if(e.keyCode === KEY.LEFT) keys.left = value;
        if(e.keyCode === KEY.RIGHT) keys.right = value;
        this.setState({keys : keys}); // set state (this will trigger the update() method so screen is re-rendered)

        e.preventDefault();
    }

    drawTitleScreen() {
        // todo: move to component
        var imageObj = new Image();
        let context = this.state.context;

        imageObj.onload = function() {
            //make sure image has loaded before rendering button to prevent image appearing after game started
            context.drawImage(imageObj, 0, 50);

            // draw start button
            const buttonX = 250;
            const buttonY = 300;
            context.beginPath();
            context.fillStyle="red";
            context.fillRect(buttonX, buttonY, 120, 50);
            context.font = "12px serif";
            context.fillStyle= '#ffffff';
            context.fillText("START GAME", buttonX + 15, buttonY + 30);
            context.fill();

            this.updateGameState('title', true);

            // todo: refactor so its always active but its coords can change
            // todo: (no need to remove the listener, you can active it already init and its reusable!)
            // todo: it might even solve that ugly binding crap..
            window.addEventListener('click', function(event){
                if (
                    event.clientX >= 250
                    && event.clientX <= 370
                    && event.clientY >= 300
                    && event.clientY <= 350
                ) {
                    this.updateGameState('start', true);
                }
            }.bind(this));
        }.bind(this);

        imageObj.src = 'assets/image/title-shiftworld.jpg';
    }

    projectionNeedsUpdate() {
        // check if the state of the keypress has changed
        if(this.oldKeyState != this.state.keys) {
            if (this.debug) {console.log('keys changed, updating scene')};
            this.oldKeyState = this.state.keys;
            return true;
        }

        // check if titleScreen needs to disappear
        if(this.state.gameStates.title && this.state.gameStates.start) {
            this.updateGameState('title', false);
            return true;
        }

        return false;
    }

    drawGrid() {
        this.gridUnits = [];

        // todo: use spread to send off grid props only
        this.grid = new Grid({
            xpos: this.state.grid.gridOffsetX,
            ypos: this.state.grid.gridOffsetY,
            gridOffsetX: this.state.grid.gridOffsetX,
            gridSize: this.state.grid.gridSize,
            context: this.state.context,
            mapData: this.state.mapData,
            gridUnits: this.gridUnits
        });
    }

    update() {
        // to improve performance, call helper function to see if update is needed
        if (this.projectionNeedsUpdate()) {
            if (this.debug){console.log('something triggered a projection update, doing so..')};

            // clears canvas for redrawing
            this.clearCanvas();

            // recreate the grid
            this.drawGrid(); // todo: figure out how to persist the gridUnits array and simply re-render
            this.grid.render(this.state); // render grid (inc grid units) todo: if you stick with this, only send off the grid specific stuff from the state
        }

        requestAnimationFrame(() => {this.update()}); // keep calling itself thus checking for req update
    }

    clearCanvas() {
        const context= this.state.context;
        context.fillStyle = "#000";
        context.fillRect( 0, 0, this.state.engine.maxWidth, this.state.engine.maxHeight );
        // alternative: this.state.context.clearRect(0, 0, this.state.engine.maxWidth, this.state.engine.maxHeight);
    }

    render() {
        return (
            <canvas id='canvas'
                width={this.state.engine.maxWidth}
                height={this.state.engine.maxHeight}
            >canvas not supported on your device</canvas>
        )
    }
}

export default Game;
