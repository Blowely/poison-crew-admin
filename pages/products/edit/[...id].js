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
  useEffect(() => {
    if (!id) {
      return;
    }
    axios.get('/api/products?id='+id).then(response => {
      setProductInfo(response.data);
      setLoading(false);
    });
  }, [id]);

  const getProduct = () => {
    if (!id) {
      return;
    }
    axios.get('/api/products?id='+id).then(response => {
      setProductInfo(response.data);
      setLoading(false);
    });
  }

  const onBackClick = () => {
    router.push('/products');
  }

  return (
    <Layout>
      <Button style={{fontSize: '17px'}} onClick={onBackClick} type="link" block>
        <span style={{float:"right"}}>{'< Products'}</span>
      </Button>
      <h1>Edit product</h1>
      {productInfo && (
        <ProductForm {...productInfo} isLoading={isLoading} setLoading={setLoading} getProduct={getProduct}/>
      )}
    </Layout>
  );
}