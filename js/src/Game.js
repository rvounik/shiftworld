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
        this.oldKeyState = {};
        this.bounds = {};

        this.debug = true;
    }

    // helper function that clears the canvas
    clearCanvas() {
        const context= this.state.context;
        context.fillStyle = "#000";
        context.fillRect( 0, 0, this.state.engine.maxWidth, this.state.engine.maxHeight );
        // alternative: this.state.context.clearRect(0, 0, this.state.engine.maxWidth, this.state.engine.maxHeight);
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

    // helper function that checks whether user clicked within an active boundary range
    clickWithinBoundsHandler(event){
        if (
            event.clientX >= this.bounds.xMin
            && event.clientX <= this.bounds.xMax
            && event.clientY >= this.bounds.yMin
            && event.clientY <= this.bounds.yMax
        ) {
            // executes the action that was registered for these boundaries, then resets them
            this.bounds.action();
            this.bounds = {};
        }
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

            // register reusable global window event listener for click events
            window.addEventListener('click', (event) => {this.clickWithinBoundsHandler(event)});

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

            // register button boundaries and action to take when clicked
            this.bounds = {
                xMin: 250,
                xMax: 370,
                yMin: 300,
                yMax: 350,
                action: function() {
                    this.updateGameState('start', true)
                }.bind(this)
            };

        }.bind(this);

        imageObj.src = 'assets/image/title-shiftworld.jpg';
    }

    drawGrid() {
        if (this.debug){console.log('drawing grid')}

        this.gridUnits = [];

        // todo: use spread or sth to send off grid props only
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
        // check if titleScreen needs to disappear
        if(this.state.gameStates.title && this.state.gameStates.start) {
            this.updateGameState('title', false);
            this.clearCanvas();
        }

        // check if grid needs to be drawn
        if(!this.state.gameStates.title && this.state.gameStates.start) {
            // but only if drawn first time OR player pressed a key todo: this is not working now
            if(this.oldKeyState != this.state.keys) {
                this.drawGrid(); // todo: figure out if it HAS to reconstruct every time
                this.grid.render(this.state);
                this.oldKeyState = this.state.keys;
            }
        }

        requestAnimationFrame(() => {this.update()}); // keep updating
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
