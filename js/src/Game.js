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
    constructor(props) {
        super(props);

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
                rotationSpeed: 1,
                lineLength: 50,
                playerSpeed: 2.5
            },
            grid: {
                gridSize: 10,
                gridOffsetX: 350,
                gridOffsetY: 305
            },
            player: {
                playerXpos: 256,
                playerYpos: 158,
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
        this.timer = new Date().getTime();
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
        // hide title screen if game has started
        if(this.state.gameStates.title && this.state.gameStates.start) {
            this.updateGameState('title', false);
            this.drawMiniMap();
        }

        // initialise game if not already done so
        if (this.state.context != null && this.state.gameStates.initialised != true) {
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

        this.update(); // triggered when state changes outside of update() method
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

    // helper function that returns new x, y for given x, y, rotation and length
    getTranslationPointsForAngle(x, y, a, length) {
        let radians = a * (PI / 180);
        let x2 = x + length * Math.cos(radians);
        let y2 = y + length * Math.sin(radians);
        return [x2, y2];
    }

    // update state according to keys being (sup)pressed
    handleKeys(value, e){
        let keys = this.state.keys; // copy state
        if(e.keyCode === KEY.UP) keys.up = value; // mutate state
        if(e.keyCode === KEY.DOWN) keys.down = value;
        if(e.keyCode === KEY.LEFT) keys.left = value;
        if(e.keyCode === KEY.RIGHT) keys.right = value;
        this.setState({keys : keys}); // set state (this will trigger the update() method so screen is re-rendered)

        e.preventDefault();
    }

    // calculates line length between 2 points
    getLineLengthBetweenPoints (x, y, x0, y0){
        return Math.sqrt((x -= x0) * x + (y -= y0) * y);
    };

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

        // build 2d projection for minimap todo: move to component
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
        // context.stroke(); // undo eventually. purely visual candy

        // build visible rays for minimap
        const rotStart = rot - this.state.engine.fieldOfVision / 2;
        const rotSlice = this.state.engine.fieldOfVision / this.state.engine.projectionWidth;

        // todo: turn into while
        for(let i = 0;i< this.state.engine.projectionWidth; i++){
            let x = this.state.player.playerXpos+this.state.grid.gridOffsetX;
            let y = this.state.player.playerYpos+this.state.grid.gridOffsetY;
            let newX = this.getTranslationPointsForAngle(x, y,rotStart + rotSlice * i, this.state.engine.lineLength)[0];
            let newY = this.getTranslationPointsForAngle(x, y,rotStart + rotSlice * i, this.state.engine.lineLength)[1];

            context.beginPath();
            context.strokeStyle = 'rgba(255, 0, 0, 0.1)';
            context.lineWidth = '1';
            context.moveTo(x, y);
            context.lineTo(newX, newY);
            context.stroke();
        }

        this.drawProjection(); // debug only!
    }

    drawProjection() {
        const context = this.state.context;
        const gridSize = this.state.grid.gridSize;
        const map = this.state.mapData[0];
        const fov = this.state.engine.fieldOfVision;
        let rectHeight = 0;

        for(let i = 0;i< this.state.engine.projectionWidth; i++) {
            let x = this.state.player.playerXpos;
            let y = this.state.player.playerYpos;
            let angle = this.state.player.playerRotation - (fov / 2);
            angle += i * (fov / this.state.engine.projectionWidth);

            if(angle > 360){angle -= 360}
            if(angle < 180 || angle > 270){console.log('WARNING: ROTATION NOT COVERED BY THIS SCENARIO YET!')}

            // figure out our current position in the array
            let tilex = parseInt(x / gridSize);
            let tiley = parseInt(y / gridSize);
            //console.log('player is at '+x+','+y+' which is '+parseInt(x / gridSize)+','+parseInt(y / gridSize)+' in the array which is a '+map[tiley][tilex]);

            // first get the modulus for current x and gridsize:
            let xModulus = x % gridSize;

            // now set some vars so we can use our old code again todo: major clean up possible and needed
            let tempy = y;
            let tempx = x;
            let newx = tempx;
            let newy = tempy;
            let shift = xModulus;
            let lineLengthForYAxis = 0;
            let newtilex = tilex;
            let newtiley = tiley;

            while(shift < x && newy > 0 && map[newtiley][newtilex-1] != 1) {
                // calculate the x,y point on the Y axis where our 'ray' will intersect next
                newy = tempy - (shift * (Math.tan((180 + angle) * (PI / 180))));
                newx = tempx - shift;
                //console.log('now at ' + x + ',' + y + ' (tile: ' + tilex + ',' + tiley + '), shift is ' + shift + ', rotation ' + angle + '. line will cut ' + parseInt(newx) + ',' + parseInt(newy));

                // draw a dot at the next intersection point on the y axis
                /*context.beginPath();
                context.rect(newx + this.state.grid.gridOffsetX, newy + this.state.grid.gridOffsetY, 2, 2);
                context.fillStyle = 'red';
                context.fill();*/

                lineLengthForYAxis = this.getLineLengthBetweenPoints(x, y, newx, newy);

                // check if there is a '1' in the corresponding index of mapData, otherwise increase shift and continue
                shift += gridSize; // increment the shift until we reach end of array (or later, a '1' in the map index)

                newtilex = parseInt(newx / gridSize);
                newtiley = parseInt(newy / gridSize);
            }

            //console.log('Y '+lineLengthForYAxis);

    // REPEAT FOR X AXIS

            /* on the separation between y-axis and x axis. imagine a grid. a grid has an x- and y-axis. the rays for the
                projection will interset lines on both axes. depending on which of those intersects is shortest, a wall
                should be drawn. if you want to understand, set i immediately to the last at the end of the loop and enable
                the creation of the dots. that will greatly help you understand what goes on.
             */

            // first get the modulus for current y and gridsize:
            let yModulus = y % gridSize;

            // now set some vars so we can use our old code again
            tempy = y;
            tempx = x;
            newx = tempx;
            newy = tempy;
            shift = yModulus;
            let lineLengthForXAxis = 0;
            newtilex = tilex;
            newtiley = tiley;

            while(shift < y && newx > 0 && map[newtiley-1][newtilex] != 1) {
                // calculate the x,y point on the X axis where our 'ray' will intersect next
                newx = tempx - (shift * (Math.tan((90 - angle) * (PI / 180))));
                newy = tempy - shift;
                //console.log('now at ' + x + ',' + y + ' (tile: ' + tilex + ',' + tiley + '), shift is ' + shift + ', rotation ' + angle + '. line will cut ' + parseInt(newx) + ',' + parseInt(newy));

                // draw a dot at the next intersection point on the y axis
                /*context.beginPath();
                context.rect(newx + this.state.grid.gridOffsetX, newy + this.state.grid.gridOffsetY, 2, 2);
                context.fillStyle = 'blue';
                context.fill();
*/
                lineLengthForXAxis = this.getLineLengthBetweenPoints(x, y, newx, newy);

                // check if there is a '1' in the corresponding index of mapData, otherwise increase shift and continue
                shift += gridSize; // increment the shift until we reach end of array (or later, a '1' in the map index)

                newtilex = parseInt(newx / gridSize);
                newtiley = parseInt(newy / gridSize);
            }

            //console.log('X '+lineLengthForXAxis);

            let shortest = lineLengthForXAxis <= lineLengthForYAxis ? lineLengthForXAxis : lineLengthForYAxis;

            //console.log('hitting a wall at '+shortest+' pixels');

            rectHeight = 100 - shortest;

            // drawing a rect with height set to 640 - distance to wall
            context.beginPath();
            context.rect(i*(this.state.engine.maxWidth/this.state.engine.projectionWidth), this.state.engine.projectionWidth+(rectHeight / 2), this.state.engine.maxWidth/this.state.engine.projectionWidth, rectHeight);
            context.fillStyle = '#ccc';
            context.fill();

            // to prevent crashes immediately set i to the end value for now
            //i = this.state.engine.projectionWidth;
        }
    }

    update() {
        // huge performance gain: restrict the number of checks per second
        if(this.timer + (1000 / this.state.engine.fps) < new Date().getTime()) {

            // do all run-time operations and checks
            if(!this.state.gameStates.title && this.state.gameStates.start) {
                let playerXpos = this.state.player.playerXpos;
                let playerYpos = this.state.player.playerYpos;
                let playerRotation = this.state.player.playerRotation;
                let playerSpeed = this.state.engine.playerSpeed;

                // lets just assume we always need to render something
                if(this.state.keys.left) {
                    this.state.player.playerRotation-=this.state.engine.rotationSpeed;
                    if(this.state.player.playerRotation<0){this.state.player.playerRotation+=360}
                    this.drawMiniMap(); // redraw map. performance penalty. remove when projection finished
                    this.drawProjection(); // redraw projection
                }
                if(this.state.keys.right) {
                    this.state.player.playerRotation+=this.state.engine.rotationSpeed;
                    if(this.state.player.playerRotation>360){this.state.player.playerRotation-=360}
                    this.drawMiniMap();
                    this.drawProjection();
                }
                if(this.state.keys.down) {
                    this.state.player.playerXpos = this.getTranslationPointsForAngle(playerXpos, playerYpos, playerRotation, 0-playerSpeed)[0];
                    this.state.player.playerYpos = this.getTranslationPointsForAngle(playerXpos, playerYpos, playerRotation, 0-playerSpeed)[1];
                    this.drawMiniMap();
                    this.drawProjection();
                }
                if(this.state.keys.up) {
                    this.state.player.playerXpos = this.getTranslationPointsForAngle(playerXpos, playerYpos, playerRotation, playerSpeed)[0];
                    this.state.player.playerYpos = this.getTranslationPointsForAngle(playerXpos, playerYpos, playerRotation, playerSpeed)[1];
                    this.drawMiniMap();
                    this.drawProjection();
                }

                // checkifenemiesneedtomove(); // call to some method that does things with enemy movement
            }

            this.timer = new Date().getTime();
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
