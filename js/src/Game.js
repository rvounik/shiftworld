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
            debug: false,
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
                fieldOfVision: 80,
                rotationSpeed: 5,
                lineLength: 50,
                playerSpeed: 3
            },
            grid: {
                gridSize: 50,
                gridOffsetX: 0,
                gridOffsetY: 0
            },
            player: {
                playerXpos: 150,
                playerYpos: 125,
                playerRotation: 180
            },
            gameStates: {
                initialised: false,
                title: false,
                start: false,
                map: false,
                end: false
            }
        };

        // local state (do not put this in the state!)
        this.bounds = {};

        // debugger
        this.debug = true;

        // fps
        this.timer = new Date().getTime();
        this.frameCount = 0;
        this.fpsTimer = 0; // this is independent from the update() timer
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
        context.fillStyle = 'black';
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

        if (this.debug){ console.log('changed gameState for '+key+' to '+value) }
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
        let imageObj = new Image();
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

        if(! this.grid){
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

        // we need to draw the line somewhere (pun intended)
        context.beginPath();
        context.strokeStyle = 'red';
        context.lineWidth = '1';
        context.moveTo(x, y);
        context.lineTo(newX, newY);
        context.stroke();

        // build visible rays for minimap
        const rotStart = rot - this.state.engine.fieldOfVision / 2;
        const rotSlice = this.state.engine.fieldOfVision / this.state.engine.projectionWidth;

        // todo: turn into while
        for(let i = 0; i < this.state.engine.projectionWidth; i ++){
            let x = this.state.player.playerXpos + this.state.grid.gridOffsetX;
            let y = this.state.player.playerYpos + this.state.grid.gridOffsetY;
            let newX = this.getTranslationPointsForAngle(x, y, rotStart + rotSlice * i, this.state.engine.lineLength)[0];
            let newY = this.getTranslationPointsForAngle(x, y, rotStart + rotSlice * i, this.state.engine.lineLength)[1];

            context.beginPath();
            context.strokeStyle = 'rgba(255, 0, 0, 0.1)';
            context.lineWidth = '1';
            context.moveTo(x, y);
            context.lineTo(newX, newY);
            context.stroke();
        }

        this.drawProjection();
    }

    drawDebugIndicationMarker(x, y, colour) {
        let context = this.state.context;
        context.beginPath();
        context.rect((x + this.state.grid.gridOffsetX) - 2, (y + this.state.grid.gridOffsetY) - 2, 4, 4);
        context.fillStyle = colour;
        context.fill();
    }

    // todo: move to component
    getLineLengthForAngle(angle) {
        // set some constants
        const x = this.state.player.playerXpos;
        const y = this.state.player.playerYpos;
        const gridSize = this.state.grid.gridSize;
        const map = this.state.mapData[0];
        const radiansConversion = PI / 180;
        const debug = this.state.debug;

        // set some variables
        let xShift, yShift;
        let newx = x;
        let newy = y;

        // calculate line length until first wall segment for shifts on the x axis

        let lineLengthForXAxis = 0;

        // set initial map indices
        let tileX = parseInt(x / gridSize);
        let tileY = parseInt(y / gridSize);

        let tempx = x;
        let tempy = y;

        while (tileX > 0 && tileY >= 0 && tileX < map[0].length && tileY < map.length) {

            if (map[tileY][tileX] != '1') {

                if (angle > 0 && angle <= 90) {
                    newx > gridSize ? xShift = gridSize - (newx % gridSize) : xShift = gridSize - newx;
                    if (xShift == 0) { xShift = gridSize }
                    newy = tempy + (xShift * (Math.tan(angle * radiansConversion)));
                    newx = tempx + xShift + 0.1; // going right, we add 1
                }
                if (angle > 90 && angle <= 180) {
                    newx < gridSize ? xShift = newx : xShift = (newx % gridSize);
                    if (xShift == 0) { xShift = gridSize }
                    newy = tempy + (xShift / (Math.tan((angle + 270) * radiansConversion)));
                    newx = tempx - xShift - 0.1; // going left, we add 1
                }
                if (angle > 180 && angle <= 270) {
                    newx < gridSize ? xShift = newx : xShift = (newx % gridSize);
                    if (xShift == 0) { xShift = gridSize }

                    newy = tempy - (xShift * (Math.tan((angle + 180) * radiansConversion)));
                    newx = tempx - xShift - 0.1; // going left, we add 1
                }
                if (angle > 270 && angle < 360) {
                    newx > gridSize ? xShift = gridSize - (newx % gridSize) : xShift = gridSize - newx;
                    if (xShift == 0) { xShift = gridSize }
                    newy = tempy - (xShift / (Math.tan((angle + 90) * radiansConversion)));
                    newx = tempx + xShift + 0.1; // going right, we add 1
                }

                // set new map indices
                tileX = parseInt(newx / gridSize);
                tileY = parseInt(newy / gridSize);

                // before adding to the lineLength, break if out of bounds on x axis
                if (newx <= 0 || newx >= map[0].length * gridSize) {
                    break;
                }

                lineLengthForXAxis = this.getLineLengthBetweenPoints(x, y, newx, newy);

                // if out of bounds on y axis, break
                if (newy <= 0 || newy >= map.length * gridSize) {
                    break;
                }

                tempx = newx;
                tempy = newy;

            } else {
                break; // encountered wall segment
            }

            if (debug) { this.drawDebugIndicationMarker(newx, newy, 'green') }

        }

        if (debug) { console.log('x (green) = ' + lineLengthForXAxis) }

        // calculate line length until first wall segment for shifts on the y axis

        let lineLengthForYAxis = 0;

        // reset some values
        tileX = parseInt(x / gridSize);
        tileY = parseInt(y / gridSize);
        tempx = x;
        tempy = y;
        newx = x;
        newy = y;
        xShift = 0;
        yShift =0;

        while (tileX > 0 && tileY >= 0 && tileX < map[0].length && tileY < map.length) {

            if (map[tileY][tileX] != '1'){

                if (angle > 0 && angle <= 90) {
                    newy > gridSize ? yShift = gridSize - (newy % gridSize) : yShift = gridSize - newy;
                    if (yShift == 0) { yShift = gridSize }
                    newx = tempx + (yShift / (Math.tan(angle * radiansConversion)));
                    newy = tempy + yShift + 0.1; // going right, we add 1
                }
                if (angle > 90 && angle <= 180) {
                    newy < gridSize ? yShift = gridSize - newy : yShift = gridSize - (newy % gridSize);
                    if (yShift == 0) { yShift = gridSize }
                    newx = tempx - (yShift * (Math.tan((angle + 270) * radiansConversion)));
                    newy = tempy + yShift + 0.1; // going right, we add 1
                }
                if (angle > 180 && angle <= 270) {
                    newy < gridSize ? yShift = newy : yShift = (newy % gridSize);
                    if (yShift == 0) { yShift = gridSize }
                    newx = tempx - (yShift / (Math.tan((angle + 180) * radiansConversion)));
                    newy = tempy - yShift - 0.1; // going left, we add 1
                }
                if (angle > 270 && angle < 360) {
                    newy > gridSize ? yShift = (newy % gridSize): yShift = newy;
                    if (yShift == 0) { yShift = gridSize }
                    newx = tempx + (yShift * (Math.tan((angle + 90) * radiansConversion)));
                    newy = tempy - yShift - 0.1; // going left, we add 1;
                }

                // set new map indices
                tileX = parseInt(newx / gridSize);
                tileY = parseInt(newy / gridSize);

                // before adding to the lineLength, break if out of bounds on y axis
                if (newy <= 0 || newy >= map.length * gridSize){
                    break;
                }

                lineLengthForYAxis = this.getLineLengthBetweenPoints(x, y, newx, newy);

                // if out of bounds on x axis, break
                if (newx <= 0 || newx >= map[0].length * gridSize){
                    break;
                }

                tempx = newx;
                tempy = newy;

            } else {
                break; // encountered wall segment
            }

            if (debug){ this.drawDebugIndicationMarker(newx, newy, 'red') }

        }

        if (debug) { console.log('y (red) = ' + lineLengthForYAxis) }

        // calculate the definitive shortest route to nearest wall
        let shortestRoute = lineLengthForXAxis <= lineLengthForYAxis ? lineLengthForXAxis : lineLengthForYAxis;

        if (debug) { console.log('shortest route is '+shortestRoute+' pixels') }

        // return shortest length
        return shortestRoute;
    }

    drawProjection() {
        const context = this.state.context;
        const resolution = this.state.engine.maxWidth / this.state.engine.projectionWidth;
        const debug = this.state.debug;
        const projectionDistance = (this.state.engine.projectionWidth/2)/Math.tan((this.state.engine.fieldOfVision/2)* (PI / 180)); // distance to projection

        for(let i = 0; i < this.state.engine.projectionWidth; i ++) {
            // re-determine angle for current 'ray' and check if valid
            let angle = (this.state.player.playerRotation) - (this.state.engine.fieldOfVision / 2); // starting angle for projection
            angle += i * (this.state.engine.fieldOfVision / this.state.engine.projectionWidth); // this is the ray' rotation, not the player'
            if (angle <= 0 || angle >= 360) { angle = 0.001 } // we cant have zeroes, mkay? zeroes are bad

            if (debug){ console.log('rotation for current ray is ' + angle) }

            let shortestRoute = this.getLineLengthForAngle(angle);

            // calculate fish eye correction
            let angleDifference = (this.state.player.playerRotation) - angle;
            let angleDifferenceInRadians = angleDifference * (PI / 180); // convert to radians
            let fishEyeCorrection = 0 - (Math.cos(angleDifferenceInRadians)); // cos of angle difference in radians

            let fragmentHeight = ((shortestRoute * (fishEyeCorrection*(shortestRoute/100))/10));

            // draw wall section with its height related to its distance and some magic numbery
            context.beginPath();
            context.rect(
                i * resolution,
                ((this.state.engine.maxHeight - fragmentHeight) / 2) + fragmentHeight,
                resolution,
                255 - shortestRoute
            );

            // the closer, the brighter
            let colorval = parseInt(Math.pow((255 - shortestRoute), 2) / 200);
            context.fillStyle = 'rgba(0, '+colorval+', 0, 1)';
            context.fill();

            // to prevent crashes immediately set i when debugging
            if (debug){ i = this.state.engine.projectionWidth }
        }
    }

    update() {
        // huge performance gain: restrict the number of checks per second
        this.frameCount ++;
        if(this.timer + (1000 / this.state.engine.fps) < new Date().getTime()) {
            this.fpsTimer ++;
            if(this.debug && this.fpsTimer > this.state.engine.fps) {
                //console.log(this.frameCount / this.state.engine.fps); // uncomment for fps
                this.fpsTimer = 0;
                this.frameCount = 0;
            }

            // do all run-time operations and checks
            if(!this.state.gameStates.title && this.state.gameStates.start) {
                let playerXpos = this.state.player.playerXpos;
                let playerYpos = this.state.player.playerYpos;
                let playerRotation = this.state.player.playerRotation;
                let playerSpeed = this.state.engine.playerSpeed;

                // lets just assume there is always something to render
                if(this.state.keys.left) {
                    this.state.player.playerRotation -= this.state.engine.rotationSpeed;
                    if(this.state.player.playerRotation < 0){this.state.player.playerRotation += 360}
                    this.drawMiniMap(); // redraw map. performance penalty. remove when projection finished
                    this.drawProjection(); // redraw projection
                }
                if(this.state.keys.right) {
                    this.state.player.playerRotation += this.state.engine.rotationSpeed;
                    if(this.state.player.playerRotation >= 360){this.state.player.playerRotation -= 360}
                    this.drawMiniMap();
                    this.drawProjection();
                }
                if(this.state.keys.down) {
                    this.state.player.playerXpos = this.getTranslationPointsForAngle(playerXpos, playerYpos, playerRotation, 0 - playerSpeed)[0];
                    this.state.player.playerYpos = this.getTranslationPointsForAngle(playerXpos, playerYpos, playerRotation, 0 - playerSpeed)[1];
                    this.drawMiniMap();
                    this.drawProjection();
                }
                if(this.state.keys.up) {
                    this.state.player.playerXpos = this.getTranslationPointsForAngle(playerXpos, playerYpos, playerRotation, playerSpeed)[0];
                    this.state.player.playerYpos = this.getTranslationPointsForAngle(playerXpos, playerYpos, playerRotation, playerSpeed)[1];
                    this.drawMiniMap();
                    this.drawProjection();
                }

                // checkifenemiesneedtomove(); // call to some method that does things with enemy movement etc.
            }

            this.timer = new Date().getTime();
        }

        // keep alive
        requestAnimationFrame(() => { this.update() });
    }

    render() {
        return (
            <canvas id = 'canvas'
                    width = {this.state.engine.maxWidth}
                    height = {this.state.engine.maxHeight}
            >Oh no! Canvas is not supported on your device :(</canvas>
        )
    }
}

export default Game;
