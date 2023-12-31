import { useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Navbar from "@/components/layout/default-layout/navbar-main";
import styles from "./index.module.css";
import Bread from "@/components/product/bread";
import Footer from "@/components/layout/default-layout/footer";

import Link from "next/link";
import AuthContext from "@/hooks/AuthContext";
import RunContext from "@/hooks/RunContext";

import Pagination from "@/components/product/pagination";

import LoadingCard from "@/components/product/loading-card";
import ws from "ws";
import WsContext from "@/hooks/WsContext";
import Swal from "sweetalert2";
import Head from "next/head";
import ProductTypeListContext from "@/hooks/ProductTypeListContext";

export default function index() {
  //資料用
  const [data, setData] = useState([]);

  const [wish, setWish] = useState([]);
  const [order, setOrder] = useState("new");
  const wsRef = useRef();

  const [inputText, setInputText] = useState("");

  const [fullText, setFullText] = useState("");
  const [isCompositing, setIsCompositing] = useState(false);

  const [type, setType] = useState("");
  const [typeList, setTypeList] = useState("");
  // console.log(typeList);

  //篩選用
  const [price, setPrice] = useState("");
  const priceList = [
    [300, 500, 800, 1000, 1001],
    ["300以下", "300 - 500", "500 - 800", "800 - 1000", "1000以上"],
  ];
  const [items, setItems] = useState([]);
  const { returnTypeList, setReturnTypeList } = useContext(
    ProductTypeListContext
  );
  console.log(returnTypeList);

  //重渲染頁面用
  const { run, setRun } = useContext(RunContext);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  //分頁用
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const lastItemIndex = currentPage * itemsPerPage;
  const firstItemIndex = lastItemIndex - itemsPerPage;
  const currentItems = data.rows?.slice(firstItemIndex, lastItemIndex);

  // 取資料

  useEffect(() => {
    if (isCompositing) return;

    fetch("http://localhost:3002/api/product", {
      method: "POST",
      body: JSON.stringify({
        uid: localStorage.getItem("auth")
          ? JSON.parse(localStorage.getItem("auth")).user_id
          : "",
        order: order,
        search: inputText,
        type: type,
        typeList: typeList.split(",")[1] || returnTypeList.split(",")[1],
        price: price,
        items: items,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((r) => {
        const a = r.json();
        return a;
      })

      .then((data) => {
        setData(data);

        //取願望資料
        if (data.rowsWish.length > 0) {
          let wishList = data.rowsWish.map((v) => v.product_id);
          setWish(wishList);
        }
      });
  }, [order, inputText, typeList, price, items, run, isCompositing]);

  // 增刪願望清單
  const handleWish = (product_id) => {
    if (!localStorage.getItem("auth")) {
      Swal.fire({
        icon: "error",
        title: "請先登入",
      });
      return;
    } else {
      if (!wish.includes(product_id)) {
        fetch("http://localhost:3002/api/product/add-wish", {
          method: "POST",
          body: JSON.stringify({
            pid: product_id,
            uid: JSON.parse(localStorage.getItem("auth")).user_id,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        })
          .then((r) => r.json())
          .then((r) => {
            console.log(r);
            if (r) {
              console.log(run);
              setRun(!run);
            }
          })
          .catch((ex) => {
            console.log(ex);
          });
      }
      if (wish.includes(product_id)) {
        fetch("http://localhost:3002/api/product/del-wish", {
          method: "POST",
          body: JSON.stringify({
            pid: product_id,
            uid: JSON.parse(localStorage.getItem("auth")).user_id,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        })
          .then((r) => r.json())
          .then((r) => {
            console.log(r);
            if (r) {
              // location.reload();

              Swal.fire({
                toast: true,
                showConfirmButton: false,
                timer: 1500,
                position: "top",
                width: "250px",
                text: "已更新願望清單",
                icon: "success",
              });
              console.log(run);
              setRun(!run);
            }
          })
          .catch((ex) => {
            console.log(ex);
          });
      }
    }
  };
  //ws-------------------------------------------
  const [msg, setMsg] = useState("");
  const { wsMsgs, setWsMsgs } = useContext(WsContext);
  const { auth } = useContext(AuthContext);

  useEffect(() => {
    let ws = (wsRef.current = new WebSocket("ws://localhost:3002/ws"));

    ws.onopen = () => {
      console.log("open connection");
    };

    ws.onmessage = (res) => {
      console.log(JSON.parse(res.data));
      const msgBack = JSON.parse(res.data);

      if (res.type === "message") {
        const newMsgs = [...wsMsgs, msgBack];
        console.log(newMsgs);

        setWsMsgs(newMsgs);
      }
    };
    ws.onclose = () => {
      console.log("close connection");
    };
  }, [wsMsgs]);

  function sendMsg() {
    let ws = wsRef.current;
    if (ws.readyState == 1) {
      ws.send(
        JSON.stringify({
          type: "message",
          id: auth.user_id || "stranger",
          name: auth.nickname || "stranger",
          content: msg,
        })
      );
    } else {
      console.log("ws.readyState不等於 1");
    }
  }
  //------------------------------------------------

  return (
    <>
      {/* ws-------------------------------- */}
      <button
        className={"btn " + styles.typing}
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#offcanvasBottom"
        aria-controls="offcanvasBottom"
        style={{
          position: "fixed",
          right: "0px",
          bottom: "200px",
          zIndex: "11",
        }}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div
        className="offcanvas offcanvas-end"
        data-bs-scroll="true"
        tabIndex="-1"
        id="offcanvasBottom"
        aria-labelledby="offcanvasBottomLabel"
        style={{
          width: "350px",
          height: "500px",
          borderRadius: "10px",
          right: "70px",
          marginTop: "215px",
        }}
      >
        <div className="offcanvas-header">
          <div style={{ borderBottom: "3px solid #b6705e" }}>
            <span className="w-auto fw-bold " style={{ color: "#666666" }}>
              HELLO{" "}
            </span>
            <span className="fs-5 fw-bold">
              {auth.user_id == 112
                ? "薯編"
                : auth.user_id
                ? auth.nickname
                : "訪客"}
            </span>
          </div>

          <button
            type="button"
            className="btn-close ms-auto"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          ></button>
        </div>
        <div className="offcanvas-body small ">
          <div
            className="scrollbar px-2"
            style={{
              height: "80%",
              marginBottom: "20px",
              overflow: "scroll",
              overflowX: "hidden",
            }}
          >
            {wsMsgs.map((m) => {
              console.log(m);
              return (
                <div
                  className={
                    (!auth.user_id && m.id === "stranger") ||
                    m.id == auth.user_id
                      ? "myMsgBox"
                      : "otherMsgBox"
                  }
                >
                  <p>{m.content}</p>
                </div>
              );
            })}
          </div>
          <div>
            <input
              className="w-75 me-3"
              type="text"
              value={msg}
              onChange={(e) => {
                setMsg(e.target.value);
              }}
            />
            <button
              className="btn btn-sm btn-secondary rounded-pill"
              onClick={() => {
                sendMsg();
                setMsg("");
              }}
            >
              送出
            </button>
          </div>
        </div>
      </div>
      {/* ---------------------------------- */}

      <div className="container" style={{ paddingTop: "203px" }}>
        <Navbar />
        <Bread typeList={typeList} data={data} />

        <div className="w-100 d-flex mb-3">
          <main className="w-100 d-flex position-relative">
            <div className={styles.leftBox}>
              <span className="icon-list"></span>
              {/* -----------分類選單---------- */}
              <div className={styles.left}>
                <button
                  onClick={() => {
                    setInputText("");
                    setTypeList("");
                    setReturnTypeList("");
                    setPrice([]);
                    setItems([]);
                  }}
                  className={styles.leftA + " btn"}
                  type="button"
                >
                  全部商品
                </button>

                {data.rowsType &&
                  data.rowsType.map((v, i) => {
                    return (
                      <>
                        <button
                          className="btn"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target={"#type" + v.product_type_id}
                          aria-expanded="false"
                          aria-controls={"#type" + v.product_type_id}
                        >
                          {v.product_type_name}
                          <span className="fs-6 ms-2 icon-arrow-down"></span>
                        </button>
                        <div
                          className="collapse"
                          id={"type" + v.product_type_id}
                        >
                          {data.rowsTypeList
                            .filter(
                              (list) =>
                                list.product_type_id === v.product_type_id
                            )
                            .map((list) => {
                              return (
                                <button
                                  className={styles.typeListBtn + " btn"}
                                  type="button"
                                  onClick={() => {
                                    setTypeList(
                                      `${list.product_type_list_id},${list.product_type_list_name}`
                                    );
                                    //在有篩選條件的狀態下按到非擁有此條件的小分類時，把非擁有的條件清掉
                                    const newItems = items.filter((v) => {
                                      const [fullItem] = data.items.filter(
                                        (a) => a.item_id == v
                                      );

                                      return fullItem.product_type_list_id
                                        .split(",")
                                        .includes(list.product_type_list_id);
                                    });
                                    setItems(newItems);
                                  }}
                                >
                                  {list.product_type_list_name}
                                </button>
                              );
                            })}
                        </div>
                      </>
                    );
                  })}
              </div>
              {/* ------------篩選條件----------- */}
              <div className={styles.left}>
                <p className="h6 px-2 pb-2">
                  篩選條件
                  <span
                    style={{
                      background: "#ebd8a9",
                      borderRadius: "40px",
                      padding: "5px",
                      fontSize: "12px",
                      color: "#3f4c5c",
                      marginLeft: "5px",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setItems([]);
                    }}
                  >
                    清除
                  </span>
                </p>
                <form className="d-flex flex-column px-2">
                  {typeList
                    ? data.items
                        ?.filter((v) => {
                          return v.product_type_list_id
                            .split(",")
                            .includes(typeList.split(",")[0]);
                        })
                        .map((v, i) => {
                          //動態篩選條件

                          return (
                            <label key={i}>
                              <input
                                checked={
                                  items.includes(v.item_id) ? true : false
                                }
                                className="mb-3"
                                type="checkbox"
                                value={v.item_id}
                                onChange={() => {
                                  if (!items.includes(v.item_id)) {
                                    const newItems = [...items, v.item_id];

                                    setItems(newItems);
                                  } else {
                                    const newItems = items.filter(
                                      (a) => a != v.item_id
                                    );
                                    setItems(newItems);
                                  }
                                }}
                              />
                              {v.item_name}
                            </label>
                          );
                        })
                    : data.items &&
                      //預設篩選條件
                      data.items.map((v, i) => {
                        return (
                          <label key={i}>
                            <input
                              checked={items.includes(v.item_id) ? true : false}
                              className="mb-3"
                              type="checkbox"
                              value={v.item_id}
                              onChange={() => {
                                if (!items.includes(v.item_id)) {
                                  const newItems = [...items, v.item_id];
                                  setItems(newItems);
                                } else {
                                  const newItems = items.filter(
                                    (a) => a != v.item_id
                                  );
                                  setItems(newItems);
                                }
                              }}
                            />
                            {v.item_name}
                          </label>
                        );
                      })}
                </form>
              </div>
              {/* ------------價格範圍----------- */}
              <div className={styles.left + " pb-2"}>
                <p className="h6 px-2 pb-1">
                  價格範圍
                  <span
                    style={{
                      background: "#ebd8a9",
                      borderRadius: "40px",
                      padding: "5px",
                      fontSize: "12px",
                      color: "#3f4c5c",
                      marginLeft: "5px",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setPrice([]);
                    }}
                  >
                    清除
                  </span>
                </p>

                {priceList[1].map((v, i) => {
                  return (
                    <label key={i} className="w-100 ps-2 my-1">
                      <input
                        className="me-2"
                        type="radio"
                        // 用目前選中的food狀態來比較，決定是否呈現選中的樣子
                        checked={price === v}
                        value={v}
                        onChange={(e) => {
                          setPrice(e.target.value);
                        }}
                      />
                      {v}
                    </label>
                  );
                })}
              </div>
            </div>
            {/* ------------搜尋列------------ */}
            <div className="container">
              <div
                className={
                  styles.sort +
                  " row d-flex justify-content-end align-items-center mb-2"
                }
              >
                <form className="col-auto d-flex " role="search">
                  <input
                    className="form-control me-1"
                    type="text"
                    placeholder="搜尋"
                    aria-label="Search"
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                    }}
                    onCompositionStart={(e) => {
                      setIsCompositing(true);
                    }}
                    onCompositionEnd={(e) => {
                      setIsCompositing(false);
                    }}
                  />
                </form>
                <select
                  value={order}
                  onChange={(e) => {
                    setOrder(e.target.value);
                  }}
                  className=" col-2 form-select form-select-sm"
                  aria-label="Small select example"
                >
                  <option value="new">最新商品</option>
                  <option value="pHigh">價格高到低</option>
                  <option value="pLow">價格低到高</option>
                </select>
              </div>

              <div className="row mb-3 d-flex justify-content-start align-items-center ">
                {/* 卡片 */}
                {isLoading ? (
                  <LoadingCard cards={8} />
                ) : (
                  currentItems?.map(
                    (
                      {
                        product_id,
                        product_name,
                        price,
                        product_description,
                        specification,
                        product_type_id,
                        product_type_list_id,
                        isValid,
                        product_img_id,
                        product_img,
                        showed_1st,
                      },
                      i
                    ) => {
                      return (
                        <div
                          key={product_id}
                          className={
                            " col-12 col-sm-6 col-md-6 col-lg-4 col-xl-3 col-xxl-3 d-flex justify-content-center align-items-center "
                          }
                        >
                          <div className={styles.cardP}>
                            <div className={styles.imgBox}>
                              <Link href={`/product/${product_id}`}>
                                <img
                                  src={"images/product/" + product_img}
                                  alt=""
                                  className={
                                    styles.myImg +
                                    " w-100 h-100 object-fit-cover"
                                  }
                                />
                              </Link>
                            </div>
                            <div
                              className={
                                styles.contentBox +
                                " px-2 w-100 d-flex justify-content-between pt-2 pb-1 align-items-start"
                              }
                            >
                              <Link
                                href={"/product/" + product_id}
                                className={styles.mylink + " fs16b"}
                              >
                                <span>{product_name}</span>
                              </Link>

                              <span
                                className={
                                  wish.includes(product_id)
                                    ? " icon-mark-fill" + " pt-1"
                                    : " icon-mark" + " pt-1"
                                }
                                style={{ cursor: "pointer" }}
                                onClick={() => {
                                  Swal.fire({
                                    toast: true,
                                    showConfirmButton: false,
                                    timer: 1500,
                                    position: "top",
                                    width: "250px",
                                    text: "已更新願望清單",
                                    icon: "success",
                                  });
                                  handleWish(product_id);
                                }}
                              ></span>
                            </div>
                            <div
                              style={{ color: "#666666" }}
                              className={
                                styles.contentBox +
                                " px-2 w-100 d-flex justify-content-between pt-1 pb-1"
                              }
                            >
                              <span>{"NT$" + price}</span>
                              <span className="icon-cark"></span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )
                )}
              </div>
              <div className="d-flex justify-content-center">
                <Pagination
                  totalItems={data.rows?.length}
                  itemsPerPage={itemsPerPage}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  dataRows={data.rows}
                />
              </div>
            </div>
          </main>
        </div>
      </div>

      <Footer />

      <Head>
        <title>食食嗑嗑-嗑零食</title>
      </Head>

      <style jsx>
        {`
          .scrollbar {
            &::-webkit-scrollbar {
              height: 5px;
              width: 5px;
            }
            &::-webkit-scrollbar-track {
              background-color: transparent;
              border-radius: 40px;
              // margin: 20px;
            }
            &::-webkit-scrollbar-thumb {
              border-radius: 40px;
              background-color: #666666;
              // background-color: rgba(239, 214, 197, 0.55);
            }
          }

          .myMsgBox {
            display: flex;
            justify-content: end;
          }

          .otherMsgBox {
            display: flex;
            justify-content: start;
          }

          .myMsgBox p {
            background-color: #ebd8a9;
            border-radius: 40px;
            padding: 5px 10px;
          }

          .otherMsgBox p {
            background-color: #b4c5d2;
            border-radius: 40px;
            padding: 5px 10px;
          }
        `}
      </style>
    </>
  );
}
