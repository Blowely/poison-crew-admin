import Layout from "@/components/Layout";
import {useRouter} from "next/router";
import {useEffect, useState} from "react";
import axios from "axios";
import ProductForm from "@/components/ProductForm";
import {Button} from "antd";

export default function EditProductPage() {
  const [productInfo, setProductInfo] = useState(null);
  const [isLoading, setLoading] = useState(true);

  const router = useRouter();
  const {id} = router.query;

  let token = ''
  if (typeof window !== 'undefined') {
    token = localStorage?.getItem('token');
    if (!token) {
      localStorage?.setItem('token', 'NzkyMjM5NTU0Mjk6NTcxNA==');
      token = 'NzkyMjM5NTU0Mjk6NTcxNA==';
    }
  }

  useEffect(() => {
    if (!id) {
      return;
    }
    axios.get(`/api/products?id=${id}&token=${token}`).then(response => {
      setProductInfo(response.data);
      setLoading(false);
    });
  }, [id]);

  const getProduct = () => {
    setLoading(true);
    if (!id) {
      return;
    }
    axios.get(`/api/products?id=${id}&token=${token}`).then(response => {
      setProductInfo(response.data);
    });
  }
  const [finalData, setFinalData] = useState(null);

  useEffect(() => {
    setFinalData(productInfo)
  },[productInfo])

  const onBackClick = () => {
    const query = localStorage.getItem('collName') || '';
    router.push(`/products${query}`);
  }

  return (
    <Layout>
      <Button style={{fontSize: '17px'}} onClick={onBackClick} type="link" block>
        <span style={{float:"right"}}>{'< Products'}</span>
      </Button>
      <h1>Edit product</h1>
      {productInfo && finalData && (
        <ProductForm {...productInfo} finalData={finalData} price={productInfo.price} isLoading={isLoading}
                     setLoading={setLoading} getProduct={getProduct}/>
      )}
    </Layout>
  );
}