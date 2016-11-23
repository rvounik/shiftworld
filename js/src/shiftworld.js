 import React from 'react';
 import { render } from 'react-dom';

 import Game from './Game';

 // extracted so json data can be fed over ajax call later on
 let mapData = [
     [1, 1, 1, 1, 1, 1, 1],
     [1, 0, 0, 0, 0, 0, 1],
     [1, 0, 0, 0, 0, 0, 1],
     [1, 0, 0, 0, 0, 0, 1],
     [1, 0, 0, 0, 0, 1, 1],
     [1, 0, 0, 0, 1, 1, 1],
     [1, 1, 0, 1, 1, 1, 1],
     [1, 1, 0, 1, 1, 1, 1],
     [1, 1, 1, 1, 1, 1, 1]
 ];

 render(
     <Game mapData={ mapData } />,
     document.getElementById('canvas-container')
 );
