import React, { Component } from 'react';
import { render }  from 'react-dom';
import GridUnit from './GridUnit'

const KEY = {
    UP:  38
};

class Game extends Component {
    constructor(props) {
        super(props);

        // set initial state todo: partition
        this.state = {
            context: null,
            maxWidth: 640,
            maxHeight: 480,
            gridSize: 20,
            mapData: [],
            keys: {
                up: false
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
        // triggered when state changes outside of update() method, for example, a keypress or timer event
        this.update();
    }

    handleKeys(value, e){
        let keys = this.state.keys; // copy state for mutation
        if(e.keyCode === KEY.UP) keys.up = value; // adjust state
        this.setState({keys : keys}); // mutate state
    }

    update() {
        // for enemy movement you would add this to the update method:
        // this.setState({ enemyX: 231 });

        this.clearCanvas();

        this.squares = []; // wipe previous list of squares
        this.drawGrid(); // build new set of squares
        this.renderObjects(this.squares); // renders squares

        requestAnimationFrame(() => {this.update()}); // keeps calling itself
    }

    clearCanvas() {
        this.state.context.clearRect(0, 0, this.state.maxWidth, this.state.maxHeight);
    }

    drawGrid() {
        let xpos = 0;
        let ypos = 0;

        this.state.mapData[0].map((row) => {
            row.map((key) => {
                let square = new GridUnit({
                    xpos: xpos,
                    ypos: ypos,
                    context: this.state.context,
                    fillColour: (key == 1 ? "#666" : "#fff"),
                    gridSize: this.state.gridSize
                });
                this.createObject(square, 'squares');
                xpos += this.state.gridSize;
            });
            ypos += this.state.gridSize;
            xpos = 0;
        })
   }

    createObject(item, itemList){
        // puts instantiated obj in given array
        this[itemList].push(item);
    }

    /* this version of updateObjects has ability to delete items, too.
      this is unused in our case since canvas is wiped / recreated every frame
    updateObjects(items, group){
        // deletes or renders
        // wait what. why do I need delete when I redraw the canvas every frame?
        let index = 0;
        for (let item of items) {
            if (item.delete) {
                // we dont need delete currently since we
                //this[group].splice(index, 1);
            } else {
                items[index].render(this.state);
            }
            index++;
        }
    }
    */

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
            <canvas id="canvas"
                width={ this.state.maxWidth }
                height={ this.state.maxHeight }
            />
        )
    }

}

export default Game;
