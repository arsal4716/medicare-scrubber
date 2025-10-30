import React, { useState } from "react";
import { useEffect, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProgressBar from "./ProgressBar";
import Results from "./Results";
import api from "../services/api";
import { Button, Form, Card, Row, Col, Container } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [publisher, setPublisher] = useState("");
  const [campaignDate, setCampaignDate] = useState(new Date());
  const [uploadTime, setUploadTime] = useState(new Date());
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);


  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setUploadTime(new Date());
  };

  const handlePublisherChange = (e) => {
    setPublisher(e.target.value);
  };

  const handleCampaignDateChange = (date) => {
    setCampaignDate(date);
  };
  const validPublishers = [
    "assuredhealth",
    "balitech",
    "bmiadvertising",
    "goldenspruce",
    "leadsexpert",
    "luxmedia",
    "maximizereach",
    "Adolicious",
    "rntw"
  ];

  const normalizePublisher = (name) => name.toLowerCase().replace(/\s+/g, "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a file");
      return;
    }
    if (!publisher) {
      toast.error("Please enter publisher name");
      return;
    }

    const normalized = normalizePublisher(publisher);
    if (!validPublishers.includes(normalized)) {
      toast.error("Invalid publisher name");
      return;
    }


    setIsUploading(true);
    setProgress(0);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("publisher", publisher);
      formData.append("campaignDate", campaignDate.toISOString());
      formData.append("uploadTime", uploadTime.toISOString());
      const response = await api.uploadFile(formData, (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setProgress(percentCompleted);
      });

      setResult(response.data);
      toast.success("File processed successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "File processing failed";

      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Container
      fluid
      className="d-flex justify-content-center align-items-center min-vh-100"
    >
      <Card
        className="shadow-sm border-0 rounded-4 p-4"
        style={{ maxWidth: "700px", width: "100%" }}
      >
        <Card.Body>
          <h4 className="mb-3 fw-bold text-primary">Medicare Scurbber</h4>
          <h4>Version Date: OCT-30-2025</h4>
          <p className="text-muted mb-4">
            Upload phone numbers (.xlsx, .csv, .xls)
            <br />
            <small>
              Phone No column name must be one of: <strong>phonenumber</strong>,{" "}
              <strong>phone</strong>, <strong>phone number</strong>,{" "}
              <strong>number</strong>, <strong>callerid</strong>,{" "}
              <strong>callerId</strong>
            </small>
          </p>

          <Form onSubmit={handleSubmit}>
            <Row className="gy-3">
              <Col md={6}>
                <Form.Group controlId="formPublisher">
                  <Form.Label className="fw-semibold">
                    Publisher Name <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter publisher name"
                    value={publisher}
                    onChange={handlePublisherChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="formCampaignDate">
                  <Form.Label className="fw-semibold">
                    Current Date <span className="text-danger">*</span>
                  </Form.Label>
                  <DatePicker
                    selected={campaignDate}
                    onChange={handleCampaignDateChange}
                    className="form-control"
                    dateFormat="yyyy-MM-dd"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group controlId="formFile" className="mt-3">
              <Form.Label className="fw-semibold">
                Upload File <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                required
              />
              <Form.Text className="text-muted">
                Selected at: {uploadTime.toLocaleString()}
              </Form.Text>
            </Form.Group>

            <div className="mt-4 d-flex justify-content-end">
              <Button
                variant="primary"
                type="submit"
                disabled={isUploading}
                className="px-4"
              >
                {isUploading ? "Processing..." : "Upload & Check"}
              </Button>
            </div>
          </Form>

          {isUploading && (
            <div className="mt-4">
              <ProgressBar progress={progress} />
              <div className="text-center mt-2">
                <strong>{progress}%</strong> - Processing...
                <div className="text-muted small">
                  Started at: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="mt-4">
              <Results
                stats={result.stats}
                downloadUrl={result.downloadUrl}
                processedAt={result.processedAt}
                publisher={result.publisher}
              />
            </div>
          )}
        </Card.Body>
        <ToastContainer position="bottom-right" autoClose={5000} />
      </Card>
    </Container>
  );
};

export default FileUpload;
