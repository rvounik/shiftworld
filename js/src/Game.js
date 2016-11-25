import React, { Component } from 'react';
import { render }  from 'react-dom';
import GridUnit from './GridUnit'

const KEY = {
    UP:  38
};

class Game extends Component {
    constructor(props) {
        super(props);

        // set initial state
        this.state = {
            context: null,
            mapData: [],
            keys: {
                up: false
            },
            engine: {
                maxWidth: 640,
                maxHeight: 480
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
    }

    componentDidMount() {
        // register key event listeners todo: needs work to handle keyup events
        window.addEventListener('keyup', this.handleKeys.bind(this, this.state.keys.up!= true));

        // add mapData that was received as props in constructor to the state
        let newState = Object.assign({}, this.state);
        newState['mapData'].push(this.props.mapData);
        this.setState(newState);

        // now that component is mounted the context of canvas element can be determined
        this.setState({ context: document.getElementById('canvas').getContext('2d') });

        // initialise the update() method that is used for all actions not initiated by the player
        requestAnimationFrame(() => {this.update()});
    }

    componentDidUpdate() {
        this.update(); // triggered when state changes outside of update() method, for example, a keypress or timer event
    }

    handleKeys(value, e){
        let keys = this.state.keys; // copy state
        if(e.keyCode === KEY.UP) keys.up = value; // mutate state
        this.setState({keys : keys}); // set state
    }

    update() {
        // for enemy movement you would, for example, add this to the update method:
        // this.setState({ enemyX: 231 });

        this.clearCanvas();

        this.squares = []; // wipe previous list of squares
        this.drawGrid(); // build new set of squares
        this.renderObjects(this.squares); // renders squares

        requestAnimationFrame(() => {this.update()}); // keeps calling itself
    }

    clearCanvas() {
        this.state.context.clearRect(0, 0, this.state.engine.maxWidth, this.state.engine.maxHeight);
    }

    drawGrid() {
        let xpos = this.state.grid.gridOffsetX;
        let ypos = this.state.grid.gridOffsetY;

        this.state.mapData[0].map((row) => {
            row.map((key) => {
                let square = new GridUnit({
                    xpos: xpos,
                    ypos: ypos,
                    context: this.state.context,
                    fillColour: (key == 1 ? '#666' : '#fff'),
                    gridSize: this.state.grid.gridSize
                });
                this.createObject(square, 'squares');
                xpos += this.state.grid.gridSize;
            });
            ypos += this.state.grid.gridSize;
            xpos = this.state.grid.gridOffsetX;
        })
   }

    createObject(item, itemList){
        // pushes instantiated obj to given array
        this[itemList].push(item);
    }

    renderObjects(items){
        // loops through given items renders them according to their local state
        let index = 0;

        items.map(item => {
            items[index].render(this.state);

            index++;
        });
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
