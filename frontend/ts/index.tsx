import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router, Route } from 'react-router-dom'

import Nav from './nav'
import AboutRoute from './routes/about'
import DepositRoute from './routes/deposit'
import CountdownRoute from './routes/countdown'
import QuickWithdrawRoute from './routes/quickWithdraw'
import ContractInfoRoute from './routes/contractInfo'
import '../less/index.less'

import {
    initStorage,
} from './storage'


const App = () => {

    initStorage()
    return (
            <div className='section'>

                <Nav />

                <div className='section'>
                    <div className='container'>
                        <Router>
                            <Route path='/' exact component={DepositRoute} />
                            <Route path='/about' exact component={AboutRoute} />
                            <Route path='/countdown' exact component={CountdownRoute} />
                            <Route path='/quick_withdraw' exact component={QuickWithdrawRoute} />
                            <Route path='/contract_info' exact component={ContractInfoRoute} />
                        </Router>
                    </div>
                </div>
            </div>
    )
}

const root = document.getElementById('root')

ReactDOM.render(<App />, root)
