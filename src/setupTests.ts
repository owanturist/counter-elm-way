import 'jest'; // tslint:disable-line:no-import-side-effect
import 'jest-enzyme'; // tslint:disable-line:no-import-side-effect

import {
    configure
} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });
