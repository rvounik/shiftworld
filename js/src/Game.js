import React, { Component } from '../../node_modules/react/react';
import { render } from '../../node_modules/react-dom/index';

class Game extends Component {
    render() {
        let something = 'test';
        const map = {
            [1,1,1,1,1,1,1],
            [1,0,0,0,0,0,1],
            [1,0,0,0,0,0,1],
            [1,0,0,0,0,0,1],
            [1,0,0,0,0,1,1],
            [1,0,0,0,1,1,1],
            [1,1,0,1,1,1,1],
            [1,1,0,1,1,1,1],
            [1,1,1,1,1,1,1]
        };

        for (var key in map) {
            return (
                <div>{ map[key] }</div>

            )
        }
    }
}

export default Game;
