import Head from "next/head";
import Link from "next/link";

import React, { useState } from "react";
import MultiSelect from "react-multi-select-component";
import {
  Button,
  ListGroupItem,
  ListGroup,
  Container,
  Row,
  Col,
} from "reactstrap";
import axios from "axios";
import useSWR from "swr";
import MySpinner from "../components/MySpinner";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AvForm, AvField } from "availity-reactstrap-validation";

const fetcher = () => {
  const res = axios
    .get("/api/events")
    .then((response) => response.data)
    .catch((error) => console.log(error));
  return res;
};

export async function getStaticProps() {
  const res = await fetcher("/api/events");
  return { props: { res } };
}

const loadRazorpay = (src) => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

const RegisterComponent = ({ res }) => {
  const [selected, setSelected] = useState([]);
  const [name, setName] = useState("dheera");
  const [collegeName, setCollegeName] = useState("joseph's college");
  const [disabled, setDisabled] = useState(false);
  const { data } = useSWR("/api/events", fetcher, {
    initialData: res,
    refreshInterval: 1000,
  });

  const events = data ? Object.values(data[0].data) : [];
  const options = [
    { label: "web eye", value: "webeye" },
    { label: "Coding", value: "coding" },
    { label: "Quiz", value: "quiz" },
  ];

  const displayRazorpay = async (values) => {
    console.log(values);
    console.log(name, collegeName);

    if (!name || !collegeName) {
      return toast.error("Name and college name are required", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }

    if (disabled) {
      return;
    }
    const result = await loadRazorpay(
      "https://checkout.razorpay.com/v1/checkout.js"
    );
    setDisabled(true);

    if (!result) {
      return toast.info("Could not load razorpay,are you online", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }

    const data = await axios
      .post(`/api/razorpay`)
      .then((response) => response.data)
      .catch(function (error) {
        console.log(error);
      });
    const options = {
      key: process.env.RAZORPAY_KEY,
      amount: data.amount,
      currency: data.currency,
      name: "St Joseph's College",
      description: "Test Transaction",
      order_id: data.id,
      image: "",
      handler: function (response) {
        return toast.success("Payment Successful", {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      },
      prefill: {
        name,
        email: "",
        contact: "",
      },
      notes: {
        eventNames: `${selected.map((select) => select.value)}`,
        college: collegeName,
      },
      theme: {
        color: "#3399cc",
      },
    };
    const paymentObject = new window.Razorpay(options);
    paymentObject.on("payment.failed", function (response) {
      return toast.error(
        `Payment Failed , with reason :${response.reason} for ${payment_id} `,
        {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        }
      );
      // alert(response.error.code);
      // alert(response.error.description);
      // alert(response.error.source);
      // alert(response.error.step);
      // alert(response.error.reason);
      // alert(response.error.metadata.order_id);
      // alert(response.error.metadata.payment_id);
    });
    paymentObject.open();
    setDisabled(false);
  };

  return (
    <Container>
      <ToastContainer />
      <Row className=" w-60 h-30 mx-auto mt-4">
        <Col sm={{ size: 6, order: 2, offset: 1 }}>
          <AvForm onSubmit={(values) => displayRazorpay(values)}>
            <h2 className="text-center">Select Events</h2>
            <AvField
              name="name"
              label="Enter your Name"
              type="text"
              errorMessage="Enter a valid name"
              validate={{
                required: { value: true },
                pattern: { value: "^[A-Za-z0-9]" },
                minLength: { value: 4 },
              }}
            />
            <AvField
              name="nameCustomMessage"
              label="Enter your college name"
              type="text"
              validate={{
                required: {
                  value: true,
                  errorMessage: "Please enter your college name",
                },
                pattern: {
                  value: "^[A-Za-z]",
                  errorMessage: "Your name must be composed only with letter",
                },
                minLength: {
                  value: 4,
                  errorMessage: "Your name must have 4 or more characters",
                },
              }}
            />
            <pre>{JSON.stringify(selected.label)}</pre>

            <MultiSelect
              options={options}
              value={selected}
              onChange={setSelected}
              labelledBy="Select"
              className="mb-4"
            />
            {selected.length > 0 && (
              <Button
                className="mr-4 mb-2"
                color="primary"
                disabled={disabled}
                onClick={() => displayRazorpay()}
              >
                Pay Now
              </Button>
            )}
            <Button
              color="danger"
              className="ml-8 mb-2"
              onClick={() => setSelected([])}
            >
              cancel
            </Button>
          </AvForm>
        </Col>

        <Col className="mb-4">
          <h2 className="text-center">Events List</h2>

          <ListGroup>
            {events.length > 0 ? (
              events &&
              events.map((singleEvent) => (
                <ListGroupItem key={singleEvent.id}>
                  {singleEvent.name} :{" "}
                  {singleEvent.seats === 0 ? "event closed" : singleEvent.seats}
                </ListGroupItem>
              ))
            ) : (
              <MySpinner />
            )}
          </ListGroup>
        </Col>
      </Row>
    </Container>
  );
};

export default RegisterComponent;