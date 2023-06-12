import Layout from "@/components/Layout";
import {useRouter} from "next/router";
import {useEffect, useState} from "react";
import axios from "axios";

export default function DeleteProductPage() {
  const router = useRouter();
  const [productInfo,setProductInfo] = useState();
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
    });
  }, [id]);
  function goBack() {
    router.push('/products');
  }
  async function deleteProduct() {
    await axios.delete('/api/products?id='+id);
    goBack();
  }
  return (
    <Layout>
      <h1 className="text-center">Do you really want to delete
        &nbsp;&quot;{productInfo?.title}&quot;?
      </h1>
      <div className="flex gap-2 justify-center">
        <button
          onClick={deleteProduct}
          className="btn-red">Yes</button>
        <button
          className="btn-default"
          onClick={goBack}>
          NO
        </button>
      </div>
    </Layout>
  );
}
