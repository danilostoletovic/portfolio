import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderTestimonials } from '../scripts/testimonials.mjs';
const entry = {name:'Test fixture',project:'Fixture project',role:'Owner',testimonial:'<script>alert(1)</script>',service:'Website',projectURL:'https://example.com/',date:'2026-09-29',image:'',public:true};
test('only literal public true renders, with escaped text and safe URLs',()=> {
 assert.equal(renderTestimonials([{public:false, testimonial:'PRIVATE_SENTINEL'},{public:'true'},{}, {public:null}]),'');
 const html=renderTestimonials([entry,{...entry,public:false,name:'PRIVATE_SENTINEL'}]);
 assert.ok(!html.includes('PRIVATE_SENTINEL'));
 assert.ok(!html.includes('<script>'));
 assert.ok(html.includes('&lt;script&gt;'));
 assert.throws(()=>renderTestimonials([{...entry,projectURL:'javascript:alert(1)'}]));
 assert.throws(()=>renderTestimonials([{...entry,image:'http://example.com/logo.png'}]));
});
