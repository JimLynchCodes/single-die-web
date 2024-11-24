import React from 'react';

import './LogHistory.css';
import { LogHistoryData } from '../die-roll/DieRoll';

function LogHistory({ data }: { data: LogHistoryData[] }) {

  console.log("log history data: ", data)

  return (
    <div className="LogHistory">
      <div className="table-container">
        <h1 className="table-title">Recent Rolls</h1>
        <table className="recent-rolls-table">
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="table-row">
                <td className="left-column">
                  <a href={"https://solscan.io/account/" + item.playerAddress}>{item.playerAddress.slice(0, 3) + '...' + item.playerAddress.slice(item.playerAddress.length - 4, item.playerAddress.length - 1)} </a>
                  wagered {+item.wager / 1_000_000_000} Sol and {item.wonOrLost}.
                  <br />
                  Guessed: {item.guess}, Rolled: {item.numberRolled}
                </td>
                <td className="right-column">{item.blockTimeAgo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LogHistory;


// interface LogHistoryData {
//   blockTimeAgo: string;
// }

// interface RecentRollsTableProps {
//   data: LogHistoryData[];
// }

// const RecentRollsTable = () => {


// };

// export default RecentRollsTable;