import Layout from "@/components/Layout";
import Link from "next/link";
import {useEffect, useState} from "react";
import axios from "axios";
import {CopyOutlined} from "@ant-design/icons";
import {notification} from "antd";

export default function Products() {
  const [products,setProducts] = useState([]);
  useEffect(() => {
    axios.get('/api/products?limit=20').then(response => {
      setProducts(response.data);
    });
  }, []);

  async function uploadPoisonImg(ev) {
    console.log('234')
    const files = ev.target?.files;
    if (files?.length > 0) {
      setIsUploading(true);
      const data = new FormData();
      for (const file of files) {
        data.append('file', file);
      }
      const res = await axios.post('/api/recognize', data);

      setIsUploading(false);
    }
  }

  const copyToClipboard = (title) => {
    navigator.clipboard.writeText(title)
    notification.success({message: 'Copied', duration: 1})
  }

  return (
    <Layout>
      <Link className="btn-primary" href={'/products/new'}>Add new product</Link>
      <table className="basic mt-2">
        <thead>
          <tr>
            <td>Product name</td>
            <td></td>
          </tr>
        </thead>
        <tbody>
          {products.items?.map(product => (
            <tr key={product._id} className="flex items-center justify-between">
              <td style={{paddingLeft: '0px'}}><img style={{height: '350px', maxWidth: 'unset' }} src={product.images[0]}/></td>
              <td className="h-auto">
                <tr><td style={{fontSize: '20px'}}>{product.title}</td></tr>
                <tr>
                  <td className="flex h-20" >
                    <Link className="btn-red" href={'/products/delete/'+product._id}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-12">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>

                    </Link>
                    <Link className="btn-default" href={'/products/edit/'+product._id}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                      Edit
                    </Link>
                    <div className="btn-default w-36 text-center flex items-center gap-1" onClick={() => copyToClipboard(product.title)}>
                      <CopyOutlined />
                      Copy title
                    </div>
                    <label className="w-36 cursor-pointer text-center flex items-center justify-center text-sm gap-1 text-primary rounded-sm bg-white shadow-sm border border-primary">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <div>
                        Poizon
                      </div>
                      <input type="file" onChange={uploadPoisonImg} className="hidden"/>
                    </label>
                  </td>
                </tr>
              </td>



            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}