import React, { Component } from 'react';
import { render }  from 'react-dom';
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
                up: false
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
            }
        };

        this.gridUnits = [];
    }

    componentDidMount() {
        // add mapData that was received as props in constructor to the state
        let newState = Object.assign({}, this.state);
        newState['mapData'].push(this.props.mapData);
        this.setState(newState);

        // now that component is mounted the context of canvas element can be determined
        this.setState({ context: document.getElementById('canvas').getContext('2d') });

        // init game
        this.init();
    }

    componentDidUpdate() {
        this.update(); // triggered when state changes outside of update() method, for example, a keypress or timer event
    }

    handleKeys(value, e){
        let keys = this.state.keys; // copy state
        if(e.keyCode === KEY.UP) keys.up = value; // mutate state
        if(e.keyCode === KEY.DOWN) keys.down = value;
        if(e.keyCode === KEY.LEFT) keys.left = value;
        if(e.keyCode === KEY.RIGHT) keys.right = value;
        this.setState({keys : keys}); // set state

        e.preventDefault();
    }

    init() {
        // register key event listeners
        window.addEventListener('keyup', this.handleKeys.bind(this, false));
        window.addEventListener('keydown', this.handleKeys.bind(this, true));

        //this.drawTitleScreen(); etc
        this.drawGrid();
    }

    drawGrid() {
        this.gridUnits = [];

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
        // for enemy movement you would, for example, add this to the update method:
        // this.setState({ enemyX: 231 });

        // clears canvas for redrawing
        this.clearCanvas();

        // recreate the grid (wish this could be persistent somehow)
       this.drawGrid();

        // render grid
        this.grid.render(this.state);
    }

    clearCanvas() {
        this.state.context.clearRect(0, 0, this.state.engine.maxWidth, this.state.engine.maxHeight);
    }

    render() {
        return (
            <canvas id='canvas'
                width={this.state.engine.maxWidth}
                height={this.state.engine.maxHeight}
            />
        )
    }
}

export default Game;
