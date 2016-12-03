import React, { Component } from 'react';
import { render }  from 'react-dom';
import update from 'immutability-helper';
import Grid from './MiniMap/Grid'

// constants
const KEY = {
    UP:  38,
    DOWN: 40,
    LEFT: 37,
    RIGHT: 39
}, PI = 3.14159265359;

class Game extends Component {
    constructor() {
        super();

        // global state
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
                fps: 25,
                maxWidth: 640,
                maxHeight: 480,
                projectionWidth: 160,
                fieldOfVision: 90,
                rotationSpeed: 10,
                lineLength: 50,
                playerSpeed: 5
            },
            grid: {
                gridSize: 10,
                gridOffsetX: 350,
                gridOffsetY: 305
            },
            player: {
                playerXpos: 250,
                playerYpos: 150,
                playerRotation: 240
            },
            gameStates: {
                initialised: false,
                title: false,
                start: false,
                map: false,
                end: false
            }
        };

        // local state (do not put these in the state!)
        this.bounds = {};

        // debugger
        this.debug = true;

        // fps
        this.frameCount = 0;
        this.timer = new Date().getTime();
    }

    // todo: move helper methods to helper component

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
        // todo: take scrolltop into account
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
        // since you cant call initialised() when the context has not been saved to the state, we need a check
        if (this.state.context != null && this.state.gameStates.initialised != true) {

            if(this.debug) {console.log('initialised game')}

            // register key event listeners
            window.addEventListener('keyup', this.handleKeys.bind(this, false));
            window.addEventListener('keydown', this.handleKeys.bind(this, true));

            // register reusable global window event listener for click events
            window.addEventListener('click', (event) => {this.clickWithinBoundsHandler(event)});

            // to complete initialised, set its gameState to true
            this.updateGameState('initialised', true);

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
            context.fillStyle = 'limegreen';
            context.fillRect(buttonX, buttonY, 120, 50);
            context.font = '12px arial';
            context.fillStyle= 'white';
            context.fillText("START GAME", buttonX + 20, buttonY + 30);
            context.fill();

            this.updateGameState('title', true);

            // register button boundaries and click action
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

    drawMiniMap() {
        this.clearCanvas();

        if(!this.grid){
            this.grid = new Grid({
                grid: this.state.grid,
                context: this.state.context,
                mapData: this.state.mapData
            });
        }

        // actually render the instantiated grid object
        this.grid.render();


        // build 2d projection for minimap todo: extract to separate method / component
        const context = this.state.context;

        let rot = this.state.player.playerRotation;
        let x = this.state.player.playerXpos + this.state.grid.gridOffsetX;
        let y = this.state.player.playerYpos + this.state.grid.gridOffsetY;
        let newX = this.getTranslationPointsForAngle(x, y, rot, this.state.engine.lineLength)[0];
        let newY = this.getTranslationPointsForAngle(x, y, rot, this.state.engine.lineLength)[1];

        // we need to draw the line somewhere (no pun intended)
        context.beginPath();
        context.strokeStyle = 'red';
        context.lineWidth = '1';
        context.moveTo(x,y);
        context.lineTo(newX, newY);
        context.stroke();

        // lets write the loop that generates the slices.. again todo: turn into while
        const rotStart = rot - this.state.engine.fieldOfVision/2;
        const rotSlice = this.state.engine.fieldOfVision / this.state.engine.projectionWidth;

        for(let i=0;i<this.state.engine.projectionWidth;i++){
            let x = this.state.player.playerXpos+this.state.grid.gridOffsetX;
            let y = this.state.player.playerYpos+this.state.grid.gridOffsetY;
            let newX = this.getTranslationPointsForAngle(x,y,rotStart + rotSlice * i, this.state.engine.lineLength)[0];
            let newY = this.getTranslationPointsForAngle(x,y,rotStart + rotSlice * i, this.state.engine.lineLength)[1];

            context.beginPath();
            context.strokeStyle = 'rgba(255,0,0,0.1)';
            context.lineWidth = '1';
            context.moveTo(x,y);
            context.lineTo(newX, newY);
            context.stroke();
        }


    }

    getTranslationPointsForAngle(x, y, a, length) {
        let radians = a * (PI / 180);
        let x2 = x + length * Math.cos(radians);
        let y2 = y + length * Math.sin(radians);
        return [x2, y2];
    }

    update() {

        // by restricting how many times things are checked we are ensuring
        // the cpu never runs out of time, resulting in much better performance
        if(this.timer+(1000/this.state.engine.fps) < new Date().getTime()) {

            // check if titleScreen needs to disappear
            if(this.state.gameStates.title && this.state.gameStates.start) {
                this.updateGameState('title', false);
                this.drawMiniMap();
            }

            // check if projection/player/enemies need to be (re)drawn
            if(!this.state.gameStates.title && this.state.gameStates.start) {
                // lets just assume we always need to render something
                if(this.state.keys.left) {
                    this.state.player.playerRotation-=this.state.engine.rotationSpeed;
                    this.drawMiniMap(); // redraw map. performance penalty. remove when projection finished
                }
                if(this.state.keys.right) {
                    this.state.player.playerRotation+=this.state.engine.rotationSpeed;
                    this.drawMiniMap(); // redraw map. performance penalty. remove when projection finished
                }
                if(this.state.keys.down) {
                    this.state.player.playerXpos =
                        this.getTranslationPointsForAngle(
                            this.state.player.playerXpos,
                            this.state.player.playerYpos,
                            this.state.player.playerRotation,
                            0-this.state.engine.playerSpeed
                        )[0];
                    this.state.player.playerYpos =
                        this.getTranslationPointsForAngle(
                            this.state.player.playerXpos,
                            this.state.player.playerYpos,
                            this.state.player.playerRotation,
                            0-this.state.engine.playerSpeed
                        )[1];
                    this.drawMiniMap(); // redraw map. performance penalty. remove when projection finished
                }
                if(this.state.keys.up) {
                    this.state.player.playerXpos =
                        this.getTranslationPointsForAngle(
                            this.state.player.playerXpos,
                            this.state.player.playerYpos,
                            this.state.player.playerRotation,
                            this.state.engine.playerSpeed
                        )[0];
                    this.state.player.playerYpos =
                        this.getTranslationPointsForAngle(
                            this.state.player.playerXpos,
                            this.state.player.playerYpos,
                            this.state.player.playerRotation,
                            this.state.engine.playerSpeed
                        )[1];
                    this.drawMiniMap(); // redraw map. performance penalty. remove when projection finished
                }

                // checkifenemiesneedtomove(); // call to some method that does things with enemy movement
            }

            this.timer = new Date().getTime();
            this.frameCount = 0;
        }

        // keep alive
        requestAnimationFrame(() => {this.update()});
    }

    render() {
        return (
            <canvas id='canvas'
                width={this.state.engine.maxWidth}
                height={this.state.engine.maxHeight}
            >Oh no! Canvas is not supported on your device :(</canvas>
        )
    }
}

export default Game;
