import React from 'react';
import { Table, Badge } from 'react-bootstrap';

const Results = ({ stats, downloadUrl }) => {
  return (
    <div className="mt-4">
      <h4>Processing Results</h4>
      <Table striped bordered hover className="mt-3">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Total Numbers Processed</td>
            <td><Badge bg="primary">{stats.total}</Badge></td>
          </tr>
          <tr>
            <td>Duplicate Numbers Found</td>
            <td><Badge bg="warning" text="dark">{stats.duplicates}</Badge></td>
          </tr>
          <tr>
            <td>Errors Encountered</td>
            <td><Badge bg="danger">{stats.errors}</Badge></td>
          </tr>
        </tbody>
      </Table>

      {downloadUrl && (
        <div className="d-grid gap-2 mt-3">
          <a 
            href={downloadUrl} 
            className="btn btn-success btn-lg"
            download
          >
            Download Full Results
          </a>
        </div>
      )}
    </div>
  );
};

export default Results;
