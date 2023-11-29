import React, { useContext, useEffect, useState, useLayoutEffect } from "react";
import { LineShareButton, LineIcon } from "next-share";
import Head from "next/head";
import Navbar from "@/components/layout/default-layout/navbar-main";
import Bread from "@/components/product/bread";
import Footer from "@/components/layout/default-layout/footer";
import styles from "./list.module.css";
import Form from "react-bootstrap/Form";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { useRouter } from "next/router";
import RunContext from "@/hooks/RunContext";
import { FacebookShareButton, FacebookIcon } from "next-share";
import {
  FacebookMessengerShareButton,
  FacebookMessengerIcon,
} from "next-share";
import Swal from "sweetalert2";
import ProductTypeListContext from "@/hooks/ProductTypeListContext";

export default function productDetail() {
  const [data, setData] = useState({
    product_id: "",
    product_name: "",
    price: "",
    product_description: "",
    specification: "",
    product_type_id: "",
    product_type_list_id: "",
    isValid: "",
    product_img_id: "",
    product_img: [],
    showed_1st: "",
  });
  // console.log(data);

  const [wish, setWish] = useState(false);
  const [score, setScore] = useState(0);

  const [quantity, setQuantity] = useState(1);
  const [recommend, setRecommend] = useState([]);

  const [clientW, setClientW] = useState("");

  const { run, setRun } = useContext(RunContext);
  const { returnTypeList, setReturnTypeList } = useContext(
    ProductTypeListContext
  );
  console.log(returnTypeList);
  const router = useRouter();

  // 取資料
  useEffect(() => {
    if (router.isReady) {
      const pid = router.query.pid; //***

      const uid = JSON.parse(localStorage.getItem("auth"))?.user_id || "";

      fetch(`http://localhost:3002/api/product/${pid}/${uid}`)
        .then((r) => r.json())
        .then((r) => {
          const scoreList = r.rowsComment
            .filter((v) => v.score)
            .map((v) => v.score);

          setData(r);
          setWish(r.rowsWished);
          setScore(
            scoreList.length
              ? (
                  scoreList.reduce((a, b) => {
                    return a + parseInt(b);
                  }, 0) / scoreList.length
                ).toFixed(1)
              : ""
          );
        });
    }
  }, [router.query.pid, run]);

  const descSplit = data.rows?.product_description.split("\\n").map((v, i) => {
    return <p key={i}>{v}</p>;
  });
  const specSplit = data.rows?.specification.split("\\n").map((v, i) => {
    return <p key={i}>{v}</p>;
  });

  // 取推薦商品
  useEffect(() => {
    if (data.rows) {
      fetch(`http://localhost:3002/api/product/product-recommend`, {
        method: "POST",
        body: JSON.stringify({
          tid: data.rows.product_type_list_id,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((r) => r.json())
        .then((r) => {
          setRecommend(r.rowsRecommend);
        });
    }
  }, [data]);

  useEffect(() => {
    const handleReSize = () => {
      setClientW(window.innerWidth);
    };

    if (window) {
      handleReSize();
    }

    window.addEventListener("resize", handleReSize);
    return () => {
      window.removeEventListener("resize", handleReSize);
    };
  }, []);

  //增刪收藏
  const handleWish = () => {
    if (!localStorage.getItem("auth")) {
      Swal.fire({
        icon: "error",
        title: "請先登入",
      });
      return;
    } else {
      if (router.isReady) {
        const pathName = router.query.pid; //{27}
        console.log(pathName);

        if (!wish) {
          fetch("http://localhost:3002/api/product/add-wish", {
            method: "POST",
            body: JSON.stringify({
              pid: pathName,
              uid: JSON.parse(localStorage.getItem("auth")).user_id,
            }),
            headers: {
              "Content-Type": "application/json",
            },
          })
            .then((r) => r.json())
            .then((r) => {
              console.log(r); //true
            })
            .catch((ex) => {
              console.log(ex);
            });
        }
        if (wish) {
          fetch("http://localhost:3002/api/product/del-wish", {
            method: "POST",
            body: JSON.stringify({
              pid: pathName,
              uid: JSON.parse(localStorage.getItem("auth")).user_id || 0,
            }),
            headers: {
              "Content-Type": "application/json",
            },
          })
            .then((r) => r.json())
            .then((r) => {
              console.log(r);
            })
            .catch((ex) => {
              console.log(ex);
            });
        }
      }
      Swal.fire({
        toast: true,
        showConfirmButton: false,
        timer: 1500,
        position: "top",
        width: "250px",
        text: "已更新願望清單",
        icon: "success",
      });
    }
  };

  //加入購物車
  const handleAddCart = () => {
    if (!localStorage.getItem("auth")) {
      Swal.fire({
        icon: "error",
        title: "請先登入",
      });
      return;
    } else {
      if (localStorage.getItem("auth")) {
        if (data.rows.product_id) {
          if (localStorage.getItem("cart")) {
            let cart = JSON.parse(localStorage.getItem("cart"));
            const existCart = cart.findIndex(
              (v) => v.product_id == router.query.pid
            );

            if (
              cart.findIndex((v) => v.product_id == data.rows.product_id) >= 0
            ) {
              const newCart = cart.map((v, i) => {
                if (v.product_id == data.rows.product_id) {
                  return { ...v, quantity: v.quantity + quantity };
                } else {
                  return { ...v };
                }
              });
              localStorage.setItem("cart", JSON.stringify(newCart));
              setRun(!run);
            } else {
              cart.unshift({
                product_id: data.rows.product_id,
                product_name: data.rows.product_name,
                price: data.rows.price,
                product_img: data.rowsImgs[0].product_img,
                quantity: quantity,
              });
              localStorage.setItem("cart", JSON.stringify(cart));
            }
          } else {
            const cart = [
              {
                product_id: data.rows.product_id,
                product_name: data.rows.product_name,
                price: data.rows.price,
                product_img: data.rowsImgs[0].product_img,
                quantity: quantity,
              },
            ];
            localStorage.setItem("cart", JSON.stringify(cart));
          }
        }
      }
    }
  };

  return (
    <>
      <div className="container  " style={{ paddingTop: "208px" }}>
        <Navbar />
        <Bread />
        {/* 分類清單------------------------- */}
        <div className={styles.topBox + " d-flex justify-content-around"}>
          <div
            className={
              styles.topBoxItem + " d-flex align-items-center flex-column"
            }
          >
            <Link
              href="/product"
              className={styles.topBoxAll + " btn "}
              type="button"
            >
              全部商品
            </Link>
          </div>

          {data.rowsType &&
            data.rowsType.map((v, i) => {
              return (
                // 大分類
                <div
                  key={i}
                  className={
                    styles.topBoxItem + " d-flex align-items-center flex-column"
                  }
                >
                  <button
                    className="btn"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target={`#collapseExample${i}`}
                    aria-expanded="false"
                    // aria-controls={`collapseExample${i}`}
                  >
                    {v.product_type_name}
                    <span
                      style={{ fontSize: "16px" }}
                      className=" ms-2 icon-arrow-down"
                    ></span>
                  </button>
                  <div className="collapse" id={`collapseExample${i}`}>
                    <div className={styles.collapseBox + " card"}>
                      {/* 小分類 */}
                      {data.rowsTypeList &&
                        data.rowsTypeList
                          .filter(
                            (f, i) => f.product_type_id == v.product_type_id
                          )
                          .map((v, i) => {
                            return (
                              <button
                                key={i}
                                className="btn"
                                onClick={() => {
                                  // console.log(
                                  //   `${v.product_type_list_id},${v.product_type_list_name}`
                                  // );

                                  setReturnTypeList(
                                    `${v.product_type_list_id},${v.product_type_list_name}`
                                  );
                                  router.push("/product");
                                }}
                              >
                                {v.product_type_list_name}
                              </button>
                            );
                          })}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
        <main className={styles.main + " w-100 "}>
          <div
            className={
              styles.productMain + " row d-flex justify-content-around mb-5"
            }
          >
            <div
              className={
                " col-12 col-sm-12 col-md-6 col-lg-6 col-xl-6 col-xxl-6 "
              }
              style={{ maxWidth: "500px" }}
            >
              <Swiper
                spaceBetween={50}
                slidesPerView={1}
                navigation={true}
                modules={[Navigation]}
                className="mySwiper"
                style={{
                  "--swiper-navigation-color": "#3f4c5c",
                }}
              >
                {data.rowsImgs?.map((v, i) => {
                  return (
                    <SwiperSlide key={i}>
                      <img
                        className="w-100 h-100"
                        src={"/images/product/" + v.product_img}
                        alt=""
                      />
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>
            <div
              className={
                " d-flex flex-column col-12 col-sm-12 col-md-6  col-lg-4 col-xl-4 col-xxl-4"
              }
            >
              <div className="my-2 h5 ">
                <p className="d-flex ">
                  <span className="me-auto">{data.rows?.product_name}</span>

                  <span
                    className={wish ? "icon-mark-fill" : "icon-mark"}
                    onClick={() => {
                      handleWish();

                      setWish(!wish);
                    }}
                  ></span>
                </p>
                <p className="">
                  <span>NT$ </span>
                  {data.rows?.price}
                </p>
              </div>
              <div className="fs-3 my-2 mb-auto d-flex align-items-center">
                {Array(5)
                  .fill(1)
                  .map((v, i) => {
                    return (
                      <span
                        key={i}
                        className={i < score ? "icon-Star-fill" : "icon-Star"}
                      ></span>
                    );
                  })}
                <span
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#666666",
                    margin: "10px 8px 6px 8px",
                  }}
                >
                  {score}
                </span>
              </div>

              <div className={styles.btnBox}>
                <form>
                  <Form.Select
                    className={" brounded"}
                    size="sm"
                    aria-label="Default select example"
                    onChange={(e) => {
                      setQuantity(parseInt(e.target.value));
                    }}
                    value={quantity}
                  >
                    {Array(10)
                      .fill(1)
                      .map((v, i) => {
                        return (
                          <option key={i} value={i + 1}>
                            {i + 1}
                          </option>
                        );
                      })}
                  </Form.Select>
                  <button
                    className="btn btn-big d-flex justify-content-center align-items-center w-100"
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddCart();
                      setRun(!run);
                    }}
                  >
                    加入購物車
                  </button>
                  <button
                    className="btn btn-big d-flex justify-content-center w-100 overflow-hidden"
                    onClick={() => {
                      handleAddCart();
                      setRun(!run);
                    }}
                  >
                    {data.rows && localStorage.getItem("auth") ? (
                      <Link
                        href="/cart"
                        className="btn-big w-100 h-100 d-flex justify-content-center align-items-center"
                      >
                        立即購買
                      </Link>
                    ) : (
                      "立即購買"
                    )}
                  </button>
                </form>
              </div>
              <div className="d-flex justify-content-around">
                <FacebookShareButton
                  url={`http://localhost:3080${router.asPath}`}
                  quote={
                    "next-share is a social share buttons for your next React apps."
                  }
                  hashtag={"#nextshare"}
                >
                  <FacebookIcon size={50} round />
                </FacebookShareButton>
                <FacebookMessengerShareButton
                  url={`http://localhost:3080${router.asPath}`}
                  appId={""}
                >
                  <FacebookMessengerIcon size={50} round />
                </FacebookMessengerShareButton>
                <LineShareButton
                  url={`http://localhost:3080${router.asPath}`}
                  title={
                    "next-share is a social share buttons for your next React apps."
                  }
                >
                  <LineIcon size={50} round />
                </LineShareButton>
              </div>
            </div>
          </div>
          {/* ------------商品內文------------ */}
          <div className={styles.infoBox + " w-100"}>
            <div className={styles.infoItem}>
              <p className={styles.head + " h4"}>商品介紹</p>
              <div className={styles.text}>{data.rows && descSplit}</div>
            </div>
            <div className={styles.infoItem}>
              <p className={styles.head + " h4"}>商品規格</p>
              <div className={styles.text}>{data.rows && specSplit}</div>
            </div>
            <div className={styles.infoItem}>
              <p className={styles.head + " h4"}>商品評論</p>
              {data.rows &&
                data.rowsComment.map((v, i) => {
                  return (
                    <div key={i} className={styles.commentBox}>
                      <div className={styles.pic + " "}>
                        <img
                          className="w-100 h-100 object-fit-cover img-thumbnail rounded-circle"
                          src={`/images/user/${v.user_img}`}
                          alt=""
                        />
                      </div>
                      <div className={styles.comment}>
                        <p>{v.nickname}</p>
                        <p>{v.content}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
          <div className={styles.recommendBox + " row pb-5"}>
            <p className={styles.head + " h4"}>推薦商品</p>
            <div className=" w-100">
              {/* ------------推薦商品----------- */}
              <Swiper
                spaceBetween={40}
                slidesPerView={clientW > 992 ? 6 : clientW > 768 ? 4 : 3}
                navigation={true}
                modules={[Navigation]}
                className={" row mySwiper p-4 "}
                style={{
                  "--swiper-navigation-color": "#3f4c5c",
                  "--swiper-navigation-size": "22px",
                }}
              >
                {recommend &&
                  recommend
                    .filter((v) => v.product_id != router.query.pid)
                    .map((v, i) => {
                      return (
                        <SwiperSlide key={i}>
                          {
                            <div
                              className="
                  justify-content-center align-items-center"
                            >
                              <div className="rounded-circle overflow-hidden">
                                <Link href={`/product/${v.product_id}`}>
                                  <img
                                    src={"/images/product/" + v.product_img}
                                    alt=""
                                    className="object-fit-cover w-100 h-100"
                                  />
                                </Link>
                              </div>
                              <div>
                                <Link
                                  href={`/product/${v.product_id}`}
                                  style={{ color: "black" }}
                                >
                                  <span>{v.product_name}</span>
                                </Link>
                              </div>
                              <div>
                                <span>NT$</span>
                                <span>{v.price}</span>
                              </div>
                            </div>
                          }
                        </SwiperSlide>
                      );
                    })}
              </Swiper>
            </div>
          </div>
        </main>
      </div>
      <Footer />
      <Head>
        <title>食食嗑嗑-嗑零食</title>
      </Head>
    </>
  );
}
