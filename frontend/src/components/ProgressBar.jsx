import React from 'react';
import { ProgressBar as BootstrapProgressBar } from 'react-bootstrap';

const ProgressBar = ({ progress }) => {
  return (
    <BootstrapProgressBar
      now={progress}
      label={`${progress}%`}
      animated
      striped
    />
  );
};

export default ProgressBar;