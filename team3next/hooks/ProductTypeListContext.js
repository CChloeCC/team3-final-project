import React from "react";
import { createContext } from "react";
import { useState } from "react";

// 商品詳細頁分類按鈕用
const ProductTypeListContext = createContext({});
export default ProductTypeListContext;

export const ProductTypeListContextProvider = ({ children }) => {
  const [returnTypeList, setReturnTypeList] = useState("");
  return (
    <ProductTypeListContext.Provider
      value={{ returnTypeList, setReturnTypeList }}
    >
      {children}
    </ProductTypeListContext.Provider>
  );
};
